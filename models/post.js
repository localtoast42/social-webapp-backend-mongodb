import mongoose from 'mongoose';
import { DateTime } from 'luxon';

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: { type: String, required: true, minLength: 3, maxLength: 100, default: "New Post" },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  postDate: { type: Date },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

PostSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

PostSchema.virtual("postDateFormatted").get(function () {
  return this.postDate ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATE_MED) : '';
});

export default mongoose.model("Post", PostSchema);