import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Like } from "../models/likeModel.js";
import { Post } from "../models/postModel.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notificationHelper.js";
import { throwIf } from "../utils/throwIf.js";

// Utility function for shared comment creation logic
const createCommentDocument = async ({
  content,
  postId,
  authorId,
  parentCommentId,
}) => {
  throwIf(
    !content || content.trim() === "",
    new ValidationError("Content is required")
  );

  const comment = new Comment({
    content: content.trim(),
    post: postId,
    author: authorId,
    parentComment: parentCommentId || null,
  });
  await comment.save();

  // Fetch with populate using findById
  const populatedComment = await Comment.findById(comment._id)
    .populate({ path: "author", select: "userName avatar" })
    .populate({ path: "parentComment", select: "content" })
    .populate({ path: "post", select: "title" });

  return {
    ...populatedComment.toObject(),
    replies: [],
    likeCount: 0,
    likes: [],
    isLiked: false,
    isSuspended: false,
  };
};
// Create a top-level comment
const createComment = asyncHandler(async (req, res) => {
  const { postId, content } = req.body;
  const userId = req.userId;

  throwIf(!postId, new ValidationError("Post ID is required"));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const post = await Post.findById(postId)
      .populate("author", "userName")
      .session(session);
    throwIf(!post || post.isSuspended, new NotFoundError("Post not found"));

    const comment = await createCommentDocument({
      content,
      postId,
      authorId: userId,
    });

    await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: comment._id },
        $inc: { commentCount: 1 },
      },
      { session }
    );

    // Notify post author if not the commenter
    if (post.author._id.toString() !== userId) {
      await createNotification({
        userId: post.author._id,
        message: `${req.user.userName} commented on your post: ${post.title}`,
        type: "comment",
        link: `/posts/${post._id}`,
      });
    }

    await session.commitTransaction();
    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment added successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// Create a nested comment (reply)
const createNestedComment = asyncHandler(async (req, res) => {
  const { parentCommentId, content } = req.body;
  const userId = req.userId;

  throwIf(
    !parentCommentId,
    new ValidationError("Parent comment ID is required")
  );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parentComment = await Comment.findById(parentCommentId)
      .populate("author", "userName")
      .session(session);
    throwIf(
      !parentComment || parentComment.isSuspended,
      new NotFoundError("Parent comment not found")
    );

    const postId = parentComment.post;
    const post = await Post.findById(postId)
      .populate("author", "userName")
      .session(session);
    throwIf(!post || post.isSuspended, new NotFoundError("Post not found"));

    let depth = 0;
    let current = parentComment;
    while (current && current.parentComment) {
      depth++;
      if (depth > 5) {
        throw new ValidationError("Maximum reply depth exceeded");
      }
      current = await Comment.findById(current.parentComment).session(session);
    }

    const comment = await createCommentDocument({
      content,
      postId,
      authorId: userId,
      parentCommentId,
    });

    await Comment.findByIdAndUpdate(
      parentCommentId,
      { $push: { replies: comment._id } },
      { session }
    );

    await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { session }
    );

    // Notify parent comment author if not the replier
    if (parentComment.author._id.toString() !== userId) {
      await createNotification({
        userId: parentComment.author._id,
        message: `${req.user.userName} replied to your comment on: ${post.title}`,
        type: "comment",
        link: `/posts/${post._id}`,
      });
    }

    await session.commitTransaction();
    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Reply added successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId, content } = req.body;
  const userId = req.userId;

  throwIf(!commentId, new ValidationError("Comment ID is required"));
  throwIf(
    !content || content.trim() === "",
    new ValidationError("Content is required")
  );

  const comment = await Comment.findById(commentId);
  throwIf(
    !comment || comment.isSuspended,
    new NotFoundError("Comment not found")
  );

  throwIf(
    comment.author._id.toString() !== userId.toString(),
    new ForbiddenError("You are not authorized to update this comment")
  );

  comment.content = content.trim();
  await comment.save();

  await comment.populate({ path: "author", select: "userName avatar" });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// Delete a comment (and its replies recursively)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  throwIf(!commentId, new ValidationError("Comment ID is required"));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const comment = await Comment.findById(commentId).session(session);
    throwIf(
      !comment || comment.isSuspended,
      new NotFoundError("Comment not found")
    );

    throwIf(
      comment.author._id.toString() !== req.userId.toString(),
      new ForbiddenError("You are not authorized to delete this comment")
    );

    // Delete replies recursively
    const deleteReplies = async (commentId) => {
      const comment = await Comment.findById(commentId)
        .select("replies")
        .session(session);
      if (!comment || !comment.replies.length) return;

      for (const replyId of comment.replies) {
        await deleteReplies(replyId);
        await Comment.findByIdAndDelete(replyId, { session });
        await Like.deleteMany({ comment: replyId }, { session });
        await Post.findByIdAndUpdate(
          comment.post,
          { $inc: { commentCount: -1 } },
          { session }
        );
      }
    };

    await deleteReplies(commentId);

    await Like.deleteMany({ comment: commentId }, { session });

    if (!comment.parentComment) {
      await Post.findByIdAndUpdate(
        comment.post,
        {
          $pull: { comments: commentId },
          $inc: { commentCount: -1 },
        },
        { session }
      );
    } else {
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: commentId } },
        { session }
      );
    }

    await Comment.findByIdAndDelete(commentId, { session });

    await session.commitTransaction();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// Get comments for a post with multi-level nested replies and pagination
const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const userId = req.userId;

  const post = await Post.findById(postId);
  throwIf(!post || post.isSuspended, new NotFoundError("Post not found"));

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const comments = await Comment.find({
    post: postId,
    isSuspended: false,
    parentComment: null, // Only top-level comments
  })
    .populate("author", "userName avatar")
    .populate({
      path: "likes",
      select: "likedBy",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Recursively fetch replies
  const fetchReplies = async (comment) => {
    if (!comment.replies || !comment.replies.length) return [];

    const replies = await Comment.find({
      _id: { $in: comment.replies },
      isSuspended: false,
    })
      .populate("author", "userName avatar")
      .populate({
        path: "likes",
        select: "likedBy",
      })
      .lean();

    for (const reply of replies) {
      reply.replies = await fetchReplies(reply);
      reply.likeCount = reply.likes.length;
      reply.isLiked = reply.likes.some(
        (like) => like.likedBy.toString() === userId
      );
      delete reply.likes;
    }

    return replies;
  };

  // Build comment tree with like status
  const commentTree = [];
  for (const comment of comments) {
    comment.replies = await fetchReplies(comment);
    comment.likeCount = comment.likes.length;
    comment.isLiked = comment.likes.some(
      (like) => like.likedBy.toString() === userId
    );
    delete comment.likes;
    commentTree.push(comment);
  }

  const totalComments = await Comment.countDocuments({
    post: postId,
    isSuspended: false,
    parentComment: null,
  });

  return res.json(
    new ApiResponse(
      200,
      {
        comments: commentTree,
        totalComments,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalComments / parseInt(limit)),
      },
      "Comments fetched successfully"
    )
  );
});

const getSuspendedComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query } = req.query;
  const userId = req.userId; // From verifyJWT middleware

  // Match stage for filtering
  const matchStage = {
    isSuspended: true,
    author: new mongoose.Types.ObjectId(userId),
    ...(query && { content: { $regex: query, $options: "i" } }),
  };

  const aggregate = Comment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { userName: 1, _id: 1 } }],
      },
    },
    { $unwind: "$author" },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "post",
        pipeline: [{ $project: { title: 1, _id: 1 } }],
      },
    },
    { $unwind: { path: "$post", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "likes",
        localField: "likes",
        foreignField: "_id",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likes.likedBy",
        foreignField: "_id",
        as: "likeUsers",
      },
    },
    {
      $addFields: {
        likes: {
          $map: {
            input: "$likes",
            as: "like",
            in: {
              likedBy: {
                $let: {
                  vars: {
                    user: {
                      $arrayElemAt: [
                        "$likeUsers",
                        {
                          $indexOfArray: ["$likeUsers._id", "$$like.likedBy"],
                        },
                      ],
                    },
                  },
                  in: {
                    _id: "$$user._id",
                    userName: "$$user.userName",
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        "author.userName": 1,
        "author._id": 1,
        "post.title": 1,
        "post._id": 1,
        createdAt: 1,
        parentComment: 1,
        replies: 1,
        isSuspended: 1,
        suspensionReason: 1,
        likeCount: { $size: "$likes" },
        likes: 1,
      },
    },
    {
      $project: {
        likeUsers: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Comment.aggregatePaginate(aggregate, options);

  // Initialize replies array for each comment (for frontend consistency)
  result.docs.forEach((comment) => {
    comment.replies = [];
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: result.docs,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalComments: result.totalDocs,
      },
      "Suspended comments fetched successfully"
    )
  );
});

export {
  createComment,
  createNestedComment,
  deleteComment,
  getComments,
  getSuspendedComments,
  updateComment,
};
