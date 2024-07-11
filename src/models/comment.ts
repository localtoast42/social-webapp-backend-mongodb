import { Schema, Types, model, Document, PopulatedDoc } from 'mongoose';
import { DateTime } from 'luxon';
import { IUser } from './user.js';

export interface IComment {
  id: Types.ObjectId;
  post: Types.ObjectId;
  author: PopulatedDoc<Document<Types.ObjectId> & IUser>;
  text: string;
  postDate: Date;
  lastEditDate: Date;
  isPublicComment: boolean;
  likes: Array<Types.ObjectId>;
  url: string;
  postDateFormatted: string;
  lastEditDateFormatted: string;
}

const CommentSchema = new Schema<IComment>({
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  postDate: { type: Date, required: true },
  lastEditDate: { type: Date },
  isPublicComment: { type: Boolean, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

CommentSchema.virtual("url").get(function () {
  return `/posts/${this.post.id}/comments/${this._id}`;
});

CommentSchema.virtual("postDateFormatted").get(function () {
  return this.postDate ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATETIME_SHORT) : '';
});

CommentSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(DateTime.DATETIME_SHORT) : '';
});

export default model<IComment>("Comment", CommentSchema);