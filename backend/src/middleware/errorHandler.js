import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Handle file filter errors
  if (err.message === "Only JPEG/PNG images are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Generic fallback for unknown errors
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: err.message || "Internal Server Error",
    errors: [],
  });
};

export { errorHandler };
