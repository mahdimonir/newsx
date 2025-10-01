import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { NotFoundError, ValidationError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notificationHelper.js";
import { throwIf } from "../utils/throwIf.js";

const getSingleUser = asyncHandler(async (req, res) => {
  const userName = req.params.userName;

  const user = await User.findOne({ userName })
    .select("-password -refreshToken")
    .populate("followers", "_id userName")
    .populate("following", "_id userName")
    .lean();

  throwIf(!user, new NotFoundError("User not found"));

  // Fetch user's posts with comments and populated likes
  const posts = await Post.aggregate([
    {
      $match: {
        author: user._id,
        isSuspended: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
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
              isSuspended: false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
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
                                $indexOfArray: [
                                  "$likeUsers._id",
                                  "$$like.likedBy",
                                ],
                              },
                            ],
                          },
                        },
                        in: {
                          _id: "$$user._id",
                          userName: "$$user.userName",
                          name: "$$user.name",
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
              "author.name": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
            },
          },
          { $project: { likeUsers: 0 } },
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
                    name: "$$user.name",
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
        title: 1,
        content: 1,
        image: 1,
        category: 1,
        tags: 1,
        status: 1,
        createdAt: 1,
        "author.userName": 1,
        "author.name": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
      },
    },
    { $project: { likeUsers: 0 } },
    { $sort: { createdAt: -1 } },
  ]);

  // Build comment tree for each post
  posts.forEach((post) => {
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
        }
      }
    });

    post.comments = topLevelComments;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...user, posts },
        "User and posts fetched successfully"
      )
    );
});

const getAllUser = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let matchStage = { isSuspended: false, isVerified: true };
  if (query) {
    matchStage = {
      ...matchStage,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
      ],
    };
  }

  const users = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "posts",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$author", "$$userId"] },
              isSuspended: false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: "$author" },
          {
            $project: {
              title: 1,
              content: 1,
              image: 1,
              category: 1,
              tags: 1,
              status: 1,
              createdAt: 1,
              "author.userName": 1,
              "author.name": 1,
              "author._id": 1,
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 3 }, // Limit posts per user for performance
        ],
        as: "posts",
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "followers._id",
        foreignField: "_id",
        as: "followerDetails",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "following._id",
        foreignField: "_id",
        as: "followingDetails",
      },
    },
    {
      $addFields: {
        followers: {
          $map: {
            input: "$followers",
            as: "follower",
            in: {
              _id: "$$follower._id",
              userName: {
                $let: {
                  vars: {
                    user: {
                      $arrayElemAt: [
                        "$followerDetails",
                        {
                          $indexOfArray: [
                            "$followerDetails._id",
                            "$$follower._id",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$user.userName",
                },
              },
            },
          },
        },
        following: {
          $map: {
            input: "$following",
            as: "follow",
            in: {
              _id: "$$follow._id",
              userName: {
                $let: {
                  vars: {
                    user: {
                      $arrayElemAt: [
                        "$followingDetails",
                        {
                          $indexOfArray: [
                            "$followingDetails._id",
                            "$$follow._id",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$user.userName",
                },
              },
            },
          },
        },
      },
    },
    { $project: { followerDetails: 0, followingDetails: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ]);

  const totalUsers = await User.countDocuments(matchStage);

  throwIf(!users || users.length === 0, new NotFoundError("No users found"));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        currentPage: parseInt(page),
      },
      "Users fetched successfully"
    )
  );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const userName = req.user.userName;

  const user = await User.findOne({ userName })
    .select("-password -refreshToken")
    .populate("followers", "_id userName")
    .populate("following", "_id userName")
    .lean();

  throwIf(!user, new NotFoundError("User not found"));

  // Fetch user's posts with comments and populated likes
  const posts = await Post.aggregate([
    {
      $match: {
        author: user._id,
        isSuspended: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
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
              isSuspended: false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
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
                                $indexOfArray: [
                                  "$likeUsers._id",
                                  "$$like.likedBy",
                                ],
                              },
                            ],
                          },
                        },
                        in: {
                          _id: "$$user._id",
                          userName: "$$user.userName",
                          name: "$$user.name",
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
              "author.name": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
            },
          },
          { $project: { likeUsers: 0 } },
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
                    name: "$$user.name",
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
        title: 1,
        content: 1,
        image: 1,
        category: 1,
        tags: 1,
        status: 1,
        createdAt: 1,
        "author.userName": 1,
        "author.name": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
      },
    },
    { $project: { likeUsers: 0 } },
    { $sort: { createdAt: -1 } },
  ]);

  // Build comment tree for each post
  posts.forEach((post) => {
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
        }
      }
    });

    post.comments = topLevelComments;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...user, posts },
        "Profile info and posts retrieved successfully"
      )
    );
});

const followUser = asyncHandler(async (req, res) => {
  const { userName } = req.body;
  const userId = req.userId;

  throwIf(
    !userName || typeof userName !== "string" || userName.trim() === "",
    new ValidationError("Username is required and must be a non-empty string")
  );

  const targetUser = await User.findOne({ userName })
    .select("_id userName isSuspended followers")
    .lean();
  throwIf(!targetUser, new NotFoundError("User not found"));
  throwIf(
    targetUser.isSuspended,
    new ValidationError("Cannot follow a suspended user")
  );
  throwIf(
    targetUser._id.toString() === userId,
    new ValidationError("Cannot follow yourself")
  );

  const currentUser = await User.findById(userId)
    .select("userName following")
    .lean();
  throwIf(!currentUser, new NotFoundError("Current user not found"));

  const isFollowing = currentUser.following.some(
    (f) => f._id.toString() === targetUser._id.toString()
  );

  if (isFollowing) {
    // Unfollow
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { following: { _id: targetUser._id } },
      }),
      User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: { _id: userId } },
      }),
    ]);
  } else {
    // Follow
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $push: {
          following: { _id: targetUser._id, userName: targetUser.userName },
        },
      }),
      User.findByIdAndUpdate(targetUser._id, {
        $push: {
          followers: { _id: userId, userName: currentUser.userName },
        },
      }),
    ]);

    // Notify the followed user
    await createNotification({
      userId: targetUser._id,
      message: `${req.user.userName} started following you`,
      type: "follow",
      link: `/users/${req.user.userName}`,
    });
  }

  // Fetch updated counts
  const [updatedCurrentUser, updatedTargetUser] = await Promise.all([
    User.findById(userId).select("following").lean(),
    User.findById(targetUser._id).select("followers").lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isFollowing: !isFollowing,
        followerCount: updatedTargetUser.followers.length,
        followingCount: updatedCurrentUser.following.length,
      },
      isFollowing ? "Unfollowed successfully" : "Followed successfully"
    )
  );
});

export { followUser, getAllUser, getSingleUser, getUserProfile };
