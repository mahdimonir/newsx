import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { throwIf } from "../utils/throwIf.js";

// Utility function to toggle suspension
const toggleSuspension = async (
  Model,
  identifier,
  entityName,
  select = "",
  isId = true
) => {
  throwIf(
    !identifier,
    new ValidationError(`${entityName} identifier is required`)
  );

  let entity;
  if (isId) {
    throwIf(
      !mongoose.Types.ObjectId.isValid(identifier),
      new ValidationError(`Invalid ${entityName} ID: ${identifier}`)
    );
    entity = await Model.findById(identifier).select(select);
  } else {
    throwIf(
      typeof identifier !== "string" || identifier.trim() === "",
      new ValidationError(`Invalid ${entityName} userName: ${identifier}`)
    );
    entity = await Model.findOne({ userName: identifier }).select(select);
  }

  throwIf(!entity, new NotFoundError(`${entityName} not found`));

  entity.isSuspended = !entity.isSuspended; // Toggle boolean (true/false)
  await entity.save();

  return {
    entity: {
      ...entity.toObject(),
      isSuspended: entity.isSuspended, // Explicitly include isSuspended
    },
    message: `${entityName} ${
      entity.isSuspended ? "suspended" : "unsuspended"
    } successfully`,
  };
};

// Toggle user suspension - admin only
const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const currentUser = req.user;

  throwIf(!currentUser, new NotFoundError("Current user not found"));
  throwIf(
    currentUser.role !== "admin",
    new ForbiddenError("Only admins can suspend users")
  );
  throwIf(
    currentUser.userName === userName,
    new ValidationError("Cannot suspend yourself")
  );

  const { entity, message } = await toggleSuspension(
    User,
    userName,
    "User",
    "-password",
    false
  );

  return res.status(200).json(new ApiResponse(200, entity, message));
});

// Toggle post suspension - admin only
const togglePostSuspension = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { entity, message } = await toggleSuspension(Post, postId, "Post");

  return res.status(200).json(new ApiResponse(200, entity, message));
});

// Toggle comment suspension - admin only
const toggleCommentSuspension = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { entity, message } = await toggleSuspension(
    Comment,
    commentId,
    "Comment"
  );

  return res.status(200).json(new ApiResponse(200, entity, message));
});

// Get suspended users
const getSuspendedUsers = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  const matchStage = query
    ? {
        isSuspended: true,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { userName: { $regex: query, $options: "i" } },
        ],
      }
    : { isSuspended: true };

  const aggregate = User.aggregate([
    { $match: matchStage },
    { $project: { password: 0 } },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await User.aggregatePaginate(aggregate, options);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: result.docs,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalUsers: result.totalDocs,
      },
      "Suspended users fetched successfully"
    )
  );
});

// Get suspended posts
const getSuspendedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const matchStage = search
    ? { title: { $regex: search, $options: "i" }, isSuspended: true }
    : { isSuspended: true };

  const aggregate = Post.aggregate([
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
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$post", "$$postId"] },
            },
          },
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
              from: "likes",
              localField: "likes",
              foreignField: "_id",
              as: "likes",
            },
          },
          {
            $project: {
              content: 1,
              "author.userName": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              isSuspended: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
            },
          },
        ],
        as: "comments",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "likes",
        foreignField: "_id",
        as: "likes",
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        image: 1,
        catagory: 1,
        tags: 1,
        status: 1,
        createdAt: 1,
        isSuspended: 1,
        "author.userName": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Post.aggregatePaginate(aggregate, options);

  // Build comment tree for each post
  result.docs.forEach((post) => {
    const commentMap = {};
    const topLevelComments = [];

    post.comments.forEach((comment) => {
      comment.replies = [];
      commentMap[comment._id.toString()] = comment;
    });

    post.comments.forEach((comment) => {
      if (!comment.parentComment) {
        topLevelComments.push(comment);
      } else {
        const parentId = comment.parentComment.toString();
        if (commentMap[parentId]) {
          commentMap[parentId].replies.push(comment);
        } else {
          topLevelComments.push(comment);
        }
      }
    });

    post.comments = topLevelComments;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: result.docs,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalPosts: result.totalDocs,
      },
      "Suspended posts retrieved successfully"
    )
  );
});

// Get suspended comments
const getSuspendedComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query } = req.query;

  // Match stage for filtering
  const matchStage = {
    isSuspended: true,
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
  getSuspendedComments,
  getSuspendedPosts,
  getSuspendedUsers,
  toggleCommentSuspension,
  togglePostSuspension,
  toggleUserSuspension,
};
