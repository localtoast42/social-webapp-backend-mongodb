import { Schema, Types, model, Document, PopulatedDoc } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { DateTime } from 'luxon';
import { User } from './user.model.js';
import { Post } from './post.model.js';

export interface CommentCreate { 
  post: Post["id"];
  author: PopulatedDoc<Document<Types.ObjectId> & User>;
  text: string;
  postDate: Date;
  isPublicComment?: boolean;
}

export interface Comment extends CommentCreate {
  id: Types.ObjectId;
  lastEditDate: Date;
  likes: Array<Types.ObjectId>;
  url: string;
  postDateFormatted: string;
  lastEditDateFormatted: string;
  isLiked?: boolean;
  numLikes?: number;
};

const commentSchema = new Schema<Comment>({
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  postDate: { type: Date, required: true },
  lastEditDate: { type: Date },
  isPublicComment: { type: Boolean, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

commentSchema.virtual("url").get(function () {
  return `/posts/${this.post.id}/comments/${this._id}`;
});

commentSchema.virtual("postDateFormatted").get(function () {
  return this.postDate ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATETIME_SHORT) : '';
});

commentSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(DateTime.DATETIME_SHORT) : '';
});

commentSchema.virtual("numLikes").get(function () {
  return this.likes.length;
});

commentSchema.plugin(mongooseLeanVirtuals);

const CommentModel = model<Comment>("Comment", commentSchema);

export default CommentModel;