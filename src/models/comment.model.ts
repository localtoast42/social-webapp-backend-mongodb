import { Schema, Types, model } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { DateTime } from "luxon";
import { User } from "./user.model";
import { Post } from "./post.model";

export interface CommentCreate {
  post: Post["_id"];
  author: User["_id"];
  text: string;
  postDate: Date;
  isPublicComment?: boolean;
}

export interface Comment extends CommentCreate {
  _id: Types.ObjectId;
  id: string;
  lastEditDate: Date;
  likes: Array<Types.ObjectId | string>;
  url: string;
  postDateFormatted: string;
  lastEditDateFormatted: string;
  numLikes?: number;
}

const opts = {
  toJSON: {
    virtuals: true,
    flattenObjectIds: true,
  },
};

const commentSchema = new Schema<Comment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    postDate: { type: Date, required: true },
    lastEditDate: { type: Date },
    isPublicComment: { type: Boolean, required: true, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  opts
);

commentSchema.virtual("url").get(function () {
  return `/posts/${this.post.id}/comments/${this._id}`;
});

commentSchema.virtual("postDateFormatted").get(function () {
  return this.postDate
    ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATETIME_SHORT)
    : "";
});

commentSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate
    ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    : "";
});

commentSchema.virtual("numLikes").get(function () {
  return this.likes?.length ?? 0;
});

commentSchema.plugin(mongooseLeanVirtuals);

const CommentModel = model<Comment>("Comment", commentSchema);

export default CommentModel;
