import { Schema, Types, model } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { DateTime } from "luxon";
import { User } from "./user.model";

export interface PostCreate {
  author: User["_id"];
  text: string;
  postDate: Date;
  isPublicPost?: boolean;
}

export interface Post extends PostCreate {
  _id: Types.ObjectId;
  id: string;
  lastEditDate: Date;
  likes: Array<Types.ObjectId | string>;
  comments: Array<Types.ObjectId | string>;
  url: string;
  postDateFormatted: string;
  lastEditDateFormatted: string;
  numLikes?: number;
  numComments?: number;
}

const opts = {
  toJSON: { virtuals: true },
};

const postSchema = new Schema<Post>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, minLength: 1, required: true },
    postDate: { type: Date, required: true },
    lastEditDate: { type: Date },
    isPublicPost: { type: Boolean, required: true, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  opts
);

postSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

postSchema.virtual("postDateFormatted").get(function () {
  return this.postDate
    ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATE_MED)
    : "";
});

postSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate
    ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(DateTime.DATE_MED)
    : "";
});

postSchema.virtual("numLikes").get(function () {
  return this.likes?.length ?? 0;
});

postSchema.virtual("numComments").get(function () {
  return this.comments?.length ?? 0;
});

postSchema.plugin(mongooseLeanVirtuals);

const PostModel = model<Post>("Post", postSchema);

export default PostModel;
