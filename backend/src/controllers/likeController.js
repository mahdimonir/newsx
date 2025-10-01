import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Like } from "../models/likeModel.js";
import { Post } from "../models/postModel.js";
import { NotFoundError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notificationHelper.js";
import { throwIf } from "../utils/throwIf.js";

// Utility function to validate and find target (Post or Comment)
const validateAndFindTarget = async (postId, commentId, userId) => {
  if (!postId && !commentId) {
    throw new Error("Either postId or commentId is required");
  }
  if (postId && commentId) {
    throw new Error("Cannot like/unlike both a post and a comment");
  }

  const isPost = !!postId;
  const Model = isPost ? Post : Comment;
  const targetId = postId || commentId;
  const field = isPost ? "post" : "comment";

  throwIf(
    !mongoose.Types.ObjectId.isValid(targetId),
    new Error(`Invalid ${isPost ? "postId" : "commentId"}`)
  );

  const target = await Model.findById(targetId).populate("author", "userName");
  throwIf(
    !target || target.isSuspended,
    new NotFoundError(isPost ? "Post not found" : "Comment or reply not found")
  );

  return { target, Model, targetId, field, isPost };
};

const toggleLike = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.body;
  const userId = req.userId;

  const { target, Model, targetId, field, isPost } =
    await validateAndFindTarget(postId, commentId, userId);

  // Check if like exists
  const existingLike = await Like.findOne({
    [field]: targetId,
    likedBy: userId,
  });

  if (existingLike) {
    // Unlike: Delete the like and remove from target
    await Like.findByIdAndDelete(existingLike._id);
    await Model.findByIdAndUpdate(targetId, {
      $pull: { likes: existingLike._id },
    });

    // Fetch updated like count
    const updatedTarget = await Model.findById(targetId).lean();
    const likeCount = updatedTarget.likes.length;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false, likeCount },
          `${isPost ? "Post" : "Comment"} unliked successfully`
        )
      );
  } else {
    // Like: Create new like and add to target
    const like = new Like({
      [field]: targetId,
      likedBy: userId,
    });
    await like.save();

    await Model.findByIdAndUpdate(targetId, { $push: { likes: like._id } });

    // Notify target author if not the liker
    if (target.author._id.toString() !== userId) {
      const message = isPost
        ? `${req.user.userName} liked your post: ${target.title}`
        : `${req.user.userName} liked your comment`;
      await createNotification({
        userId: target.author._id,
        message,
        type: "like",
        link: isPost ? `/posts/${target._id}` : `/posts/${target.post}`,
      });
    }

    // Fetch updated like count
    const updatedTarget = await Model.findById(targetId).lean();
    const likeCount = updatedTarget.likes.length;

    // Fetch the like with populated likedBy (including userName and avatar)
    const populatedLike = await Like.findById(like._id)
      .populate("likedBy", "userName avatar")
      .lean();

    // Transform the response to match desired format
    const responseData = {
      ...populatedLike,
      likedBy: {
        _id: populatedLike.likedBy._id,
        userName: populatedLike.likedBy.userName,
        avatar: populatedLike.likedBy.avatar,
      },
      isLiked: true,
      likeCount,
    };

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          responseData,
          `${isPost ? "Post" : "Comment"} liked successfully`
        )
      );
  }
});

export { toggleLike };
