import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    catagory: [
      {
        type: String,
        default: "all",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    image: {
      type: String, // URL of the main image
    },
    images: [
      {
        url: {
          type: String,
          required: [true, "Image URL is required"],
        },
        alt: {
          type: String,
          default: "Image",
        },
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Like",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Populate author for find queries, but avoid populating in aggregations
postSchema.pre(/^find/, function (next) {
  // Only populate if not in an aggregation pipeline
  if (!this.pipeline) {
    this.populate({
      path: "author",
      select: "userName avatar",
    });
  }
  next();
});

postSchema.plugin(mongooseAggregatePaginate);

export const Post = model("Post", postSchema);
