import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, minLength: 3, maxLength: 100 },
  password: { type: String, required: true },
  imageUrl: { type: String },
  firstName: { type: String, required: true, maxLength: 100 },
  lastName: { type: String, required: true, maxLength: 100 },
  city: { type: String, required: true, maxLength: 200 },
  state: { type: String, required: true, maxLength: 200 },
  country: { type: String, required: true, maxLength: 200 },
  isAdmin: { type: Boolean, required: true, default: false },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

UserSchema.virtual("fullName").get(function () {
  let fullName = "";
  if (this.firstName && this.lastName) {
    fullName = `${this.firstName} ${this.lastName}`;
  }

  return fullName;
});

UserSchema.virtual("url").get(function () {
  return `/users/${this._id}`;
});

export default mongoose.model("User", UserSchema);