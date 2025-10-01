import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { AuthError, ForbiddenError, NotFoundError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { throwIf } from "../utils/throwIf.js";

// Middleware to authenticate users
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  // Check if the token exists and starts with "Bearer"
  throwIf(!authToken, new AuthError("Unauthorized request!"));

  try {
    const decodedToken = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);

    // Verify the token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    throwIf(!user, new AuthError("Invalid access token"));

    // Attach user details to the request object
    req.userId = user._id;
    req.userName = user.userName;
    req.user = user;
    next();
  } catch (error) {
    throwIf(
      error.name === "TokenExpiredError",
      new AuthError("Token expired, please login again")
    );

    throw new AuthError("Login to access this");
  }
});

// Middleware to authorized access based on roles
export const authorized = (role) =>
  asyncHandler(async (req, res, next) => {
    const userId = req.userId;
    // Find the user
    const user = await User.findById(userId).select("-password");

    throwIf(!user, new NotFoundError("User not found"));

    // Check if the user's role is allowed
    throwIf(
      !role.includes(user.role),
      new ForbiddenError("You are not authorized")
    );
    next();
  });
