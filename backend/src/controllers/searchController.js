import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No search query provided"));
  }

  const users = await User.find(
    {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
      ],
      isSuspended: false,
      isVerified: true,
    },
    {
      _id: 1,
      name: 1, // Include name for UserCard
      userName: 1,
      email: 1,
      avatar: 1,
      role: 1, // For UserCard badge
    }
  ).limit(5); // Limit to 5 results for performance

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users found successfully"));
});

const searchPosts = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No search query provided"));
  }

  const posts = await Post.aggregate([
    {
      $match: {
        isSuspended: false,
        status: "approved",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
        ],
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
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { "author.userName": { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        status: 1, // Include status for PostCard
        "author._id": 1,
        "author.userName": 1,
        "author.avatar": 1,
        catagory: 1,
      },
    },
    { $limit: 5 }, // Limit to 5 results for performance
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts found successfully"));
});

export { searchPosts, searchUsers };
