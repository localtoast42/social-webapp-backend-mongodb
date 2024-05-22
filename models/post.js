import mongoose from 'mongoose';
import { DateTime } from 'luxon';

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: { type: String, required: true, minLength: 3, maxLength: 100, default: "New Post" },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedDate: { type: Date },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

PostSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

PostSchema.virtual("publishedDateFormatted").get(function () {
  return this.publishedDate ? DateTime.fromJSDate(this.publishedDate).toLocaleString(DateTime.DATE_MED) : '';
});

export default mongoose.model("Post", PostSchema);