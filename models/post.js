import mongoose from 'mongoose';
import { DateTime } from 'luxon';

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, minLength: 1, required: true },
  postDate: { type: Date, required: true },
  lastEditDate: { type: Date },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

PostSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

PostSchema.virtual("postDateFormatted").get(function () {
  return this.postDate ? DateTime.fromJSDate(this.postDate).toLocaleString(DateTime.DATE_MED) : '';
});

PostSchema.virtual("lastEditDateFormatted").get(function () {
  return this.lastEditDate ? DateTime.fromJSDate(this.lastEditDate).toLocaleString(DateTime.DATE_MED) : '';
});

export default mongoose.model("Post", PostSchema);