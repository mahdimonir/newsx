import swaggerAutogen from "swagger-autogen";

const swaggerAutogenInstance = swaggerAutogen();

const outputFile = "./src/swagger-output.json";
const endpointsFiles = [
  "./src/routes/adminRoutes.js",
  "./src/routes/authRoutes.js",
  "./src/routes/commentRoutes.js",
  "./src/routes/likeRoutes.js",
  "./src/routes/postRoutes.js",
  "./src/routes/userRoutes.js",
];

const doc = {
  info: {
    title: "Newsx API",
    description: "API Documentation for Newsx application",
  },
  host:
    process.env.NODE_ENV === "production"
      ? "blog-sphere-backend-ruby.vercel.app"
      : "localhost:8000",
  schemes: [process.env.NODE_ENV === "production" ? "https" : "http"],
  basePath: "/api/v1",
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter token in format: Bearer <token>",
    },
  },
  definitions: {
    ApiResponse: {
      status: { type: "integer", example: 200 },
      data: { type: "object" },
      message: { type: "string", example: "Operation successful" },
    },
    User: {
      _id: { type: "string", example: "60d21b4667d0d8992e610c84" },
      name: { type: "string", example: "John Doe" },
      email: { type: "string", example: "john@example.com" },
      userName: { type: "string", example: "johndoe" },
      avatar: { type: "string", example: "https://example.com/avatar.png" },
      role: { type: "string", example: "user" },
    },
    Post: {
      _id: { type: "string", example: "60d21b4667d0d8992e610c85" },
      title: { type: "string", example: "My First Post" },
      content: { type: "string", example: "This is the content of my post." },
      author: { $ref: "#/definitions/User" },
      image: { type: "string", example: "https://example.com/image.png" },
      catagory: { type: "string", example: "Tech" },
      tags: {
        type: "array",
        items: { type: "string" },
        example: ["tech", "blog"],
      },
      contentTable: { type: "string", example: "Table of contents" },
    },
    Comment: {
      _id: { type: "string", example: "60d21b4667d0d8992e610c86" },
      content: { type: "string", example: "Great post!" },
      author: { $ref: "#/definitions/User" },
      postId: { type: "string", example: "60d21b4667d0d8992e610c85" },
      parentCommentId: { type: "string", example: null },
      depth: { type: "integer", example: 0 },
    },
    Like: {
      _id: { type: "string", example: "60d21b4667d0d8992e610c87" },
      userId: { type: "string", example: "60d21b4667d0d8992e610c84" },
      postId: { type: "string", example: "60d21b4667d0d8992e610c85" },
      commentId: { type: "string", example: null },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Sign up a new user",
        description:
          "Registers a new user and sends an OTP for email verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "User's full name" },
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                  password: { type: "string", description: "User's password" },
                },
                required: ["name", "email", "password"],
                example: {
                  name: "John Doe",
                  email: "john@example.com",
                  password: "Password123!",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          409: { description: "User already exists" },
          500: { description: "Server error" },
        },
      },
    },
    "/auth/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify user account with OTP",
        description: "Verifies a user’s email using the provided OTP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                  otp: { type: "string", description: "One-time password" },
                },
                required: ["email", "otp"],
                example: {
                  email: "john@example.com",
                  otp: "123456",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email verified",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid OTP or already verified" },
          404: { description: "User not found" },
        },
      },
    },
    "/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend OTP for email verification",
        description: "Resends an OTP to the user’s email for verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                },
                required: ["email"],
                example: {
                  email: "john@example.com",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "New OTP sent",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Already verified" },
          404: { description: "User not found" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in a user",
        description: "Authenticates a user and returns access/refresh tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                  userName: { type: "string", description: "User's username" },
                  password: { type: "string", description: "User's password" },
                  rememberMe: {
                    type: "boolean",
                    description: "Extend token expiration",
                  },
                },
                required: ["password"],
                example: {
                  email: "john@example.com",
                  password: "Password123!",
                  rememberMe: true,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User logged in",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          401: { description: "Invalid credentials" },
          403: { description: "Email not verified" },
        },
      },
    },
    "/auth/forget-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset OTP",
        description: "Sends an OTP to reset the user’s password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                },
                required: ["email"],
                example: {
                  email: "john@example.com",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset OTP sent",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "User not found" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        description: "Resets the user’s password using the provided OTP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                  otp: { type: "string", description: "One-time password" },
                  password: { type: "string", description: "New password" },
                },
                required: ["email", "otp", "password"],
                example: {
                  email: "john@example.com",
                  otp: "123456",
                  password: "NewPassword123!",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid password" },
          404: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Generates a new access token using a refresh token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: {
                    type: "string",
                    description: "Refresh token",
                  },
                },
                required: ["refreshToken"],
                example: {
                  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Token refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out a user",
        description: "Invalidates the user’s refresh token to log out.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "User logged out",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/update-user": {
      patch: {
        tags: ["Auth"],
        summary: "Update user information",
        description:
          "Updates the authenticated user’s profile details (name, email, or username). At least one field must be provided.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "User's full name" },
                  email: {
                    type: "string",
                    description: "User's email address",
                  },
                  userName: { type: "string", description: "User's username" },
                },
                example: {
                  name: "John Doe",
                  email: "john.doe@example.com",
                  userName: "johndoe",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid input or no fields provided" },
          409: { description: "Email or username already taken" },
          404: { description: "User not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/update-avatar": {
      patch: {
        tags: ["Auth"],
        summary: "Update user avatar",
        description: "Updates the authenticated user’s avatar image.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  avatar: {
                    type: "string",
                    format: "binary",
                    description: "Avatar image file (e.g., PNG, JPEG)",
                  },
                },
                required: ["avatar"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Avatar updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Avatar missing or invalid file type" },
          404: { description: "User not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/delete-user": {
      delete: {
        tags: ["Auth"],
        summary: "Delete user account",
        description: "Deletes the authenticated user’s account.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "User not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users and their posts",
        description:
          "Retrieves a list of users with their posts, supporting search by name, email, or username.",
        parameters: [
          {
            in: "query",
            name: "query",
            description: "Search by name, email, or username",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Users and posts fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "No users found" },
        },
      },
    },
    "/users/{userName}": {
      get: {
        tags: ["Users"],
        summary: "Get a single user and their posts",
        description: "Retrieves a user’s profile and posts by their username.",
        parameters: [
          {
            in: "path",
            name: "userName",
            description: "Username of the user",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "User and posts fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "User not found" },
        },
      },
    },
    "/users/profile/me": {
      get: {
        tags: ["Users"],
        summary: "Get authenticated user's profile",
        description:
          "Retrieves the profile and posts of the authenticated user.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Profile and posts retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "User not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users/suspend/posts": {
      get: {
        tags: ["Users"],
        summary: "Get authenticated user's suspended posts",
        description:
          "Retrieves paginated suspended posts of the authenticated user, with optional title search.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "search",
            description: "Search by post title",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
        ],
        responses: {
          200: {
            description: "Suspended posts fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          500: { description: "Failed to paginate" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users/suspend/comments": {
      get: {
        tags: ["Users"],
        summary: "Get authenticated user's suspended comments",
        description:
          "Retrieves paginated suspended comments of the authenticated user, with optional content search.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "query",
            description: "Search by comment content",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
        ],
        responses: {
          200: {
            description: "Suspended comments fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          500: { description: "Failed to paginate" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "Get all posts",
        description: "Retrieves paginated posts with optional title search.",
        parameters: [
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
          {
            in: "query",
            name: "search",
            description: "Search by post title",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Posts retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid query parameters" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a new post",
        description:
          "Creates a new post with optional image upload. Requires authentication.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title of the post" },
                  content: {
                    type: "string",
                    description: "Content of the post",
                  },
                  catagory: {
                    type: "string",
                    description: "Category of the post",
                  },
                  tags: { type: "string", description: "Comma-separated tags" },
                  contentTable: {
                    type: "string",
                    description: "Content table for the post",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                    description: "Optional post image (e.g., PNG, JPEG)",
                  },
                },
                required: ["title", "content"],
                example: {
                  title: "My First Post",
                  content: "This is the content of my post.",
                  catagory: "Tech",
                  tags: "tech, blog",
                  contentTable: "Table of contents",
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Post created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: {
            description: "Invalid input (e.g., missing title or content)",
          },
          401: { description: "Unauthorized" },
          500: { description: "Image upload failed" },
        },
      },
    },
    "/posts/my": {
      get: {
        tags: ["Posts"],
        summary: "Get authenticated user's posts",
        description:
          "Retrieves posts created by the authenticated user with optional title search.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "search",
            description: "Search by post title",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "User's posts retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "No posts found" },
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get a single post",
        description: "Retrieves a post by its ID.",
        parameters: [
          {
            in: "path",
            name: "id",
            description: "ID of the post",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Post retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "Post not found" },
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update a post",
        description:
          "Updates an existing post with optional image upload. Requires authentication.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            description: "ID of the post to update",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title of the post" },
                  content: {
                    type: "string",
                    description: "Content of the post",
                  },
                  catagory: {
                    type: "string",
                    description: "Category of the post",
                  },
                  tags: { type: "string", description: "Comma-separated tags" },
                  contentTable: {
                    type: "string",
                    description: "Content table for the post",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                    description: "Optional post image (e.g., PNG, JPEG)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Post updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid input" },
          403: { description: "Unauthorized (not post owner)" },
          404: { description: "Post not found" },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete a post",
        description: "Deletes a post by its ID. Requires authentication.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            description: "ID of the post to delete",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Post deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          403: { description: "Unauthorized (not post owner)" },
          404: { description: "Post not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/comments": {
      post: {
        tags: ["Comments"],
        summary: "Create a top-level comment",
        description: "Creates a new top-level comment on a post.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  postId: {
                    type: "string",
                    description: "ID of the post to comment on",
                  },
                  content: {
                    type: "string",
                    description: "Content of the comment",
                  },
                },
                required: ["postId", "content"],
                example: {
                  postId: "60d21b4667d0d8992e610c85",
                  content: "Great post!",
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Comment created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: {
            description: "Invalid input (e.g., missing postId or content)",
          },
          404: { description: "Post not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/comments/replies": {
      post: {
        tags: ["Comments"],
        summary: "Create a nested comment (reply)",
        description:
          "Creates a nested comment as a reply to an existing comment (max depth: 5).",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  parentCommentId: {
                    type: "string",
                    description: "ID of the parent comment",
                  },
                  content: {
                    type: "string",
                    description: "Content of the reply",
                  },
                },
                required: ["parentCommentId", "content"],
                example: {
                  parentCommentId: "60d21b4667d0d8992e610c86",
                  content: "Thanks for the insight!",
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Reply created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid input or max depth exceeded" },
          404: { description: "Parent comment or post not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/comments/{commentId}": {
      patch: {
        tags: ["Comments"],
        summary: "Update a comment",
        description: "Updates the content of an existing comment.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "commentId",
            description: "ID of the comment to update",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "Updated content of the comment",
                  },
                },
                required: ["content"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Comment updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid input (e.g., missing content)" },
          403: { description: "Unauthorized (not comment owner)" },
          404: { description: "Comment not found" },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment",
        description: "Deletes a comment and its replies.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "commentId",
            description: "ID of the comment to delete",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Comment deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid comment ID" },
          403: { description: "Unauthorized (not comment owner)" },
          404: { description: "Comment not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/comments/{postId}": {
      get: {
        tags: ["Comments"],
        summary: "Get comments for a post",
        description:
          "Retrieves all top-level comments and their replies for a post.",
        parameters: [
          {
            in: "path",
            name: "postId",
            description: "ID of the post",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Comments retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          404: { description: "Post not found" },
        },
      },
    },
    "/admin/suspension/user/{userId}": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle user suspension",
        description:
          "Toggles the suspension status of a user. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "userId",
            description: "ID of the user",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "User suspension toggled",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid user ID" },
          404: { description: "User not found" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/admin/suspend/users": {
      get: {
        tags: ["Admin"],
        summary: "Get suspended users",
        description:
          "Retrieves paginated suspended users with optional search. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "query",
            description: "Search by name, email, or username",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
        ],
        responses: {
          200: {
            description: "Suspended users fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          500: { description: "Failed to paginate" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/admin/suspension/post/{postId}": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle post suspension",
        description:
          "Toggles the suspension status of a post. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "postId",
            description: "ID of the post",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Post suspension toggled",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid post ID" },
          404: { description: "Post not found" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/admin/suspend/posts": {
      get: {
        tags: ["Admin"],
        summary: "Get suspended posts",
        description:
          "Retrieves paginated suspended posts with optional title search. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "search",
            description: "Search by post title",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
        ],
        responses: {
          200: {
            description: "Suspended posts fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          500: { description: "Failed to paginate" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/admin/suspension/comment/{commentId}": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle comment suspension",
        description:
          "Toggles the suspension status of a comment. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "commentId",
            description: "ID of the comment",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Comment suspension toggled",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid comment ID" },
          404: { description: "Comment not found" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/admin/suspend/comments": {
      get: {
        tags: ["Admin"],
        summary: "Get suspended comments",
        description:
          "Retrieves paginated suspended comments with optional content search. Requires admin role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "query",
            description: "Search by comment content",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "page",
            description: "Page number",
            schema: { type: "integer", example: 1 },
          },
          {
            in: "query",
            name: "limit",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
        ],
        responses: {
          200: {
            description: "Suspended comments fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          500: { description: "Failed to paginate" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (not admin)" },
        },
      },
    },
    "/likes/toggle": {
      patch: {
        tags: ["Likes"],
        summary: "Toggle like on a post or comment",
        description:
          "Adds or removes a like on a post or comment (mutually exclusive).",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      postId: {
                        type: "string",
                        description: "ID of the post to like",
                      },
                    },
                    required: ["postId"],
                  },
                  {
                    type: "object",
                    properties: {
                      commentId: {
                        type: "string",
                        description: "ID of the comment to like",
                      },
                    },
                    required: ["commentId"],
                  },
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Like added",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          200: {
            description: "Like removed",
            content: {
              "application/json": {
                schema: { $ref: "#/definitions/ApiResponse" },
              },
            },
          },
          400: { description: "Invalid input" },
          404: { description: "Resource not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
  },
};

// Generate Swagger documentation
swaggerAutogenInstance(outputFile, endpointsFiles, doc);
