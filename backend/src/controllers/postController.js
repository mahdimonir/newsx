import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Like } from "../models/likeModel.js";
import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { createNotification } from "../utils/notificationHelper.js";
import { throwIf } from "../utils/throwIf.js";

// Create a new post
const createPost = asyncHandler(async (req, res) => {
  throwIf(!req.userId, new ValidationError("Unauthorized"));

  const {
    title = "",
    content = "",
    catagory = "all",
    tags = [],
    contentTable = "",
  } = req.body || {};
  throwIf(
    !title || !content,
    new ValidationError("Title and content required")
  );

  let imageUrl = req.body.image;
  const imageFile = req.files?.image?.[0];
  if (imageFile) {
    const image = await uploadOnCloudinary(imageFile.path);
    throwIf(!image?.url, new ValidationError("Image upload failed"));
    imageUrl = image.url;
  }

  const post = new Post({
    title,
    content,
    image: imageUrl || null,
    catagory,
    tags: Array.isArray(tags)
      ? tags
      : tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
    contentTable,
    author: req.userId,
  });
  await post.save();
  await post.populate("author", "userName avatar");

  // Notify followers
  const followers = await mongoose
    .model("User")
    .find({ following: req.userId });
  for (const follower of followers) {
    await createNotification({
      userId: follower._id,
      message: `${post.author.userName} created a new post: ${title}`,
      type: "post",
      link: `/posts/${post._id}`,
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

// Update an existing post
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  throwIf(!post || post.isSuspended, new NotFoundError("Post not found"));

  throwIf(
    post.author._id.toString() !==
      (req.userId.toString ? req.userId.toString() : req.userId),
    new ForbiddenError("Unauthorized")
  );

  let imageUrl = req.body.image || post.image;
  const imageFile = req.files?.image?.[0];
  if (imageFile) {
    if (post.image) {
      await deleteFileFromCloudinary(post.image);
    }
    const image = await uploadOnCloudinary(imageFile.path);
    throwIf(!image?.url, new ValidationError("Image upload failed"));
    imageUrl = image.url;
  }

  const { title, content, catagory, tags, contentTable, status } =
    req.body || {};
  Object.assign(post, {
    title: title || post.title,
    content: content || post.content,
    image: imageUrl,
    catagory: catagory || post.catagory,
    tags: tags
      ? Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
      : post.tags,
    contentTable: contentTable || post.contentTable,
    status: status || post.status,
  });
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post updated successfully"));
});

// Delete a post and associated comments/likes
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("Attempting to delete post with ID:", id);

  const post = await Post.findById(id);
  throwIf(!post, new NotFoundError("Post not found"));
  throwIf(
    post.author._id.toString() !==
      (req.userId.toString ? req.userId.toString() : req.userId),
    new ForbiddenError("Unauthorized")
  );

  if (post.image) {
    console.log("Deleting image from Cloudinary:", post.image);
    await deleteFileFromCloudinary(post.image);
  }

  console.log("Deleting comments for post:", id);
  await Comment.deleteMany({ post: id });
  console.log("Deleting likes for post:", id);
  await Like.deleteMany({ post: id });
  console.log("Deleting post from database:", id);
  await Post.findByIdAndDelete(id);

  console.log("Post deleted successfully:", id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

const getPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sort = "createdAt",
    order = "desc",
    catagory,
    author, // New query parameter for userName
  } = req.query;
  const userId = req.userId; // From verifyJWT middleware

  // Resolve author userName to userId if provided
  let authorId;
  if (author) {
    const user = await User.findOne({ userName: author }).select("_id");
    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Author not found"));
    }
    authorId = user._id;
  }

  // Match stage for filtering
  const matchStage = {
    status: "approved",
    isSuspended: false,
    ...(search && { title: { $regex: search, $options: "i" } }),
    ...(catagory &&
      catagory !== "All" && { catagory: { $regex: catagory, $options: "i" } }),
    ...(authorId && { author: new mongoose.Types.ObjectId(authorId) }),
  };

  // Base aggregation pipeline
  const aggregate = Post.aggregate([
    { $match: matchStage },
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
                          avatar: "$$user.avatar",
                        },
                      },
                    },
                  },
                },
              },
              isLiked: userId
                ? {
                    $anyElementTrue: {
                      $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                          $eq: [
                            "$$like.likedBy._id",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  }
                : false,
            },
          },
          {
            $project: {
              content: 1,
              "author.userName": 1,
              "author.avatar": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
              isSuspended: 1,
            },
          },
          {
            $project: {
              likeUsers: 0,
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
                    avatar: "$$user.avatar",
                  },
                },
              },
            },
          },
        },
        isLiked: userId
          ? {
              $anyElementTrue: {
                $map: {
                  input: "$likes",
                  as: "like",
                  in: {
                    $eq: [
                      "$$like.likedBy._id",
                      new mongoose.Types.ObjectId(userId),
                    ],
                  },
                },
              },
            }
          : false,
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        image: 1,
        catagory: 1,
        tags: 1,
        contentTable: 1,
        status: 1,
        createdAt: 1,
        isSuspended: 1,
        "author.userName": 1,
        "author.avatar": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
        isLiked: 1,
      },
    },
    {
      $project: {
        likeUsers: 0,
      },
    },
    { $sort: { [sort]: order === "asc" ? 1 : -1 } },
  ]);

  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Post.aggregatePaginate(aggregate, options);

  // Build comment tree for each post
  const posts = result.docs.map((post) => {
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
    return post;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalPosts: result.totalDocs,
      },
      "Approved posts retrieved successfully"
    )
  );
});

// Pending posts
const getPendingPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const userId = req.userId;

  const matchStage = {
    isSuspended: false,
    status: "pending",
    author: new mongoose.Types.ObjectId(userId),
    ...(search && { title: { $regex: search, $options: "i" } }),
  };

  const aggregate = Post.aggregate([
    { $match: matchStage },
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
                          avatar: "$$user.avatar",
                        },
                      },
                    },
                  },
                },
              },
              isLiked: userId
                ? {
                    $anyElementTrue: {
                      $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                          $eq: [
                            "$$like.likedBy._id",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  }
                : false,
            },
          },
          {
            $project: {
              content: 1,
              "author.userName": 1,
              "author.avatar": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
              isSuspended: 1,
            },
          },
          {
            $project: {
              likeUsers: 0,
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
                    avatar: "$$user.avatar",
                  },
                },
              },
            },
          },
        },
        isLiked: userId
          ? {
              $anyElementTrue: {
                $map: {
                  input: "$likes",
                  as: "like",
                  in: {
                    $eq: [
                      "$$like.likedBy._id",
                      new mongoose.Types.ObjectId(userId),
                    ],
                  },
                },
              },
            }
          : false,
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        image: 1,
        catagory: 1,
        tags: 1,
        contentTable: 1,
        status: 1,
        createdAt: 1,
        isSuspended: 1,
        "author.userName": 1,
        "author.avatar": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
        isLiked: 1,
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

  const result = await Post.aggregatePaginate(aggregate, options);

  // Build comment tree for each post
  const posts = result.docs.map((post) => {
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
    return post;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalPosts: result.totalDocs,
      },
      "Pending posts retrieved successfully"
    )
  );
});

const getSuspendedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query } = req.query;
  const userId = req.userId;

  const matchStage = {
    isSuspended: true,
    author: new mongoose.Types.ObjectId(userId),
    ...(query && { title: { $regex: query, $options: "i" } }),
  };

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
                    avatar: "$$user.avatar",
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
        excerpt: 1,
        author: { userName: 1, _id: 1 },
        createdAt: 1,
        commentCount: 1,
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

  const result = await Post.aggregatePaginate(aggregate, options);

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

// Get user's own posts
const getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const userId = req.userId;

  const matchStage = {
    isSuspended: false,
    status: "approved",
    author: new mongoose.Types.ObjectId(userId),
    ...(search && { title: { $regex: search, $options: "i" } }),
  };

  const aggregate = Post.aggregate([
    { $match: matchStage },
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
                          avatar: "$$user.avatar",
                        },
                      },
                    },
                  },
                },
              },
              isLiked: userId
                ? {
                    $anyElementTrue: {
                      $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                          $eq: [
                            "$$like.likedBy._id",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  }
                : false,
            },
          },
          {
            $project: {
              content: 1,
              "author.userName": 1,
              "author.avatar": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
              isSuspended: 1,
            },
          },
          {
            $project: {
              likeUsers: 0,
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
                    avatar: "$$user.avatar",
                  },
                },
              },
            },
          },
        },
        isLiked: userId
          ? {
              $anyElementTrue: {
                $map: {
                  input: "$likes",
                  as: "like",
                  in: {
                    $eq: [
                      "$$like.likedBy._id",
                      new mongoose.Types.ObjectId(userId),
                    ],
                  },
                },
              },
            }
          : false,
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        image: 1,
        catagory: 1,
        tags: 1,
        contentTable: 1,
        status: 1,
        createdAt: 1,
        isSuspended: 1,
        "author.userName": 1,
        "author.avatar": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
        isLiked: 1,
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

  const result = await Post.aggregatePaginate(aggregate, options);

  // Build comment tree for each post
  const posts = result.docs.map((post) => {
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
    return post;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalPosts: result.totalDocs,
      },
      "My posts retrieved successfully"
    )
  );
});

// Get a single post by ID
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError("Invalid post ID");
  }

  const aggregate = Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id), isSuspended: false } },
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
                          avatar: "$$user.avatar",
                        },
                      },
                    },
                  },
                },
              },
              isLiked: userId
                ? {
                    $anyElementTrue: {
                      $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                          $eq: [
                            "$$like.likedBy._id",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  }
                : false,
            },
          },
          {
            $project: {
              content: 1,
              "author.userName": 1,
              "author.avatar": 1,
              "author._id": 1,
              createdAt: 1,
              parentComment: 1,
              replies: 1,
              likeCount: { $size: "$likes" },
              likes: 1,
              isSuspended: 1,
            },
          },
          {
            $project: {
              likeUsers: 0,
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
                    avatar: "$$user.avatar",
                  },
                },
              },
            },
          },
        },
        isLiked: userId
          ? {
              $anyElementTrue: {
                $map: {
                  input: "$likes",
                  as: "like",
                  in: {
                    $eq: [
                      "$$like.likedBy._id",
                      new mongoose.Types.ObjectId(userId),
                    ],
                  },
                },
              },
            }
          : false,
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        image: 1,
        catagory: 1,
        tags: 1,
        contentTable: 1,
        status: 1,
        createdAt: 1,
        isSuspended: 1,
        "author.userName": 1,
        "author.avatar": 1,
        "author._id": 1,
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        comments: 1,
        likes: 1,
        isLiked: 1,
      },
    },
    {
      $project: {
        likeUsers: 0,
      },
    },
  ]);

  const result = await aggregate.exec();
  if (!result || result.length === 0) {
    throw new NotFoundError("Post not found");
  }

  const post = result[0];
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

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post retrieved successfully"));
});

export {
  createPost,
  deletePost,
  getMyPosts,
  getPendingPosts,
  getPost,
  getPosts,
  getSuspendedPosts,
  updatePost,
};
