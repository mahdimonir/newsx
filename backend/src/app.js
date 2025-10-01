import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createRequire } from "module";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a require function for loading JSON
const require = createRequire(import.meta.url);
const swaggerDocument = require("./swagger-output.json");

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

// Serve Swagger UI static files
app.use(
  "/swagger-ui",
  express.static(path.join(__dirname, "../node_modules/swagger-ui-dist"))
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Apply Multer for multipart/form-data requests
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

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handler
app.use(errorHandler);

export { app };
