import { Schema, Types, model } from 'mongoose';
import { DateTime } from 'luxon';

export interface IPost {
  id: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  postDate: Date;
  lastEditDate: Date;
  isPublicPost: boolean;
  likes: Array<Types.ObjectId>;
  comments: Array<Types.ObjectId>;
  url: string;
  postDateFormatted: string;
  lastEditDateFormatted: string;
};

const postSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, minLength: 1, required: true },
  postDate: { type: Date, required: true },
  lastEditDate: { type: Date },
  isPublicPost: { type: Boolean, required: true, default: false },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
});

postSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

postSchema.virtual("postDateFormatted").get(function () {
  return this.postDate ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATE_MED) : '';
});

postSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(DateTime.DATE_MED) : '';
});

const Post = model<IPost>("Post", postSchema);

export default Post;