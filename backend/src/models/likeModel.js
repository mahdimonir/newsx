import { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "likedBy",
    select: "userName _id avatar",
  });
  next();
});

likeSchema.plugin(mongooseAggregatePaginate);
export const Like = model("Like", likeSchema);
