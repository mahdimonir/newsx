import dotenv from "dotenv";
import app from "../src/app.js";
import connectDB from "../src/db/index.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB before handling requests
connectDB()
  .then(() => {
    console.log("MongoDB connected successfully for serverless function");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

export default app;
