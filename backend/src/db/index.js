import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
  }

  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 1, // Single connection for serverless
    });

    isConnected = true;
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
      isConnected = false;
      console.error("MongoDB connection error:", error);
    });

    return connectionInstance;
  } catch (error) {
    console.log("MONGODB connection Failed :", error.message);
    isConnected = false;
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
