import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: [8, "Password must be at least 8 characters!"],
    },
    userName: {
      type: String,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary url
    },
    bio: {
      type: String,
      trim: true,
    },
    following: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, required: true },
      },
    ],
    followers: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, required: true },
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    otp: {
      type: String,
    },
    otpExpires: {
      type: Number,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    resetPasswordOTP: {
      type: String,
    },
    resetPasswordOTPExpires: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongooseAggregatePaginate);

// Explicitly define unique indexes
userSchema.index({ userName: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ "followers._id": 1 });
userSchema.index({ "following._id": 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    // Skip hashing if the password is not modified
    if (!this.isModified("password")) return next();

    // Hash the password
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(new Error(`Failed to hash password: ${error.message}`));
  }
});

// Verify password
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!password) {
    throw new Error("Provided password is missing or empty");
  }
  if (!this.password) {
    throw new Error("Stored password hash is missing");
  }
  return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, userName: this.userName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = model("User", userSchema);
