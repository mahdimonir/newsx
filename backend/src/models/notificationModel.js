import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["comment", "like", "follow"],
      required: true,
    },
    link: {
      type: String, // e.g., "/posts/789"
    },
  },
  { timestamps: true }
);

notificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "userName avatar",
  });
  next();
});

notificationSchema.plugin(mongooseAggregatePaginate);

export const Notification = model("Notification", notificationSchema);
