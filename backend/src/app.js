import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorHandler.js";
import { upload } from "./middleware/multerMiddleware.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import likeRouter from "./routes/likeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import postRouter from "./routes/postRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import userRouter from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) || [
  "http://localhost:3000",
  "http://localhost:8000",
  "https://blog-sphere-backend-ruby.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS policy: Blocked origin ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    maxAge: 86400,
  })
);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Newsx API",
      version: "1.0.0",
      description: "API Documentation for Newsx application",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://blog-sphere-backend-ruby.vercel.app/api/v1"
            : "http://localhost:8000/api/v1",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description: "Enter token in format: Bearer <token>",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            status: { type: "integer", example: 200 },
            data: { type: "object" },
            message: { type: "string", example: "Operation successful" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c84" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            userName: { type: "string", example: "johndoe" },
            avatar: {
              type: "string",
              example: "https://example.com/avatar.png",
            },
            role: { type: "string", example: "user" },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c85" },
            title: { type: "string", example: "My First Post" },
            content: {
              type: "string",
              example: "This is the content of my post.",
            },
            author: { $ref: "#/components/schemas/User" },
            image: { type: "string", example: "https://example.com/image.png" },
            catagory: { type: "string", example: "Tech" },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["tech", "blog"],
            },
            contentTable: { type: "string", example: "Table of contents" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c86" },
            content: { type: "string", example: "Great post!" },
            author: { $ref: "#/components/schemas/User" },
            postId: { type: "string", example: "60d21b4667d0d8992e610c85" },
            parentCommentId: { type: "string", example: null },
            depth: { type: "integer", example: 0 },
          },
        },
        Like: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c87" },
            userId: { type: "string", example: "60d21b4667d0d8992e610c84" },
            postId: { type: "string", example: "60d21b4667d0d8992e610c85" },
            commentId: { type: "string", example: null },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/adminRoutes.js",
    "./src/routes/authRoutes.js",
    "./src/routes/commentRoutes.js",
    "./src/routes/likeRoutes.js",
    "./src/routes/postRoutes.js",
    "./src/routes/userRoutes.js",
    "./src/routes/notificationRoutes.js",
    "./src/routes/searchRoutes.js",
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Apply Multer for multipart/form-data
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) {
    upload(req, res, next);
  } else {
    next();
  }
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/notifications", notificationRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello from Express server with mahdi!!");
});

// MongoDB connection - only connect if not already connected
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

// Connect to MongoDB
connectDB();

// Error handler
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
