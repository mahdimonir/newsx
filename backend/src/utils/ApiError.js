// Base API Error class
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error classes based on ApiError
class NotFoundError extends ApiError {
  constructor(message = "Request not found", errors = []) {
    super(404, message, errors);
  }
}

class ValidationError extends ApiError {
  constructor(message = "Invalid request data", errors = []) {
    super(400, message, errors);
  }
}

class AuthError extends ApiError {
  constructor(message = "Unauthorized", errors = []) {
    super(401, message, errors);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = "Forbidden access", errors = []) {
    super(403, message, errors);
  }
}

class DatabaseError extends ApiError {
  constructor(message = "Database error", errors = []) {
    super(500, message, errors);
  }
}

class RateLimitError extends ApiError {
  constructor(
    message = "Too many requests, please try again later",
    errors = []
  ) {
    super(429, message, errors);
  }
}

// Export all error classes
export {
  ApiError,
  AuthError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
};
