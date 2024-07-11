import { Schema, Types, model } from 'mongoose';

export interface IUser {
  id: Types.ObjectId;
  username: string;
  password: string;
  imageUrl: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  isAdmin: boolean;
  isGuest: boolean;
  followers: Array<Types.ObjectId>;
  following: Array<Types.ObjectId>;
  fullName: string;
  url: string;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, minLength: 3, maxLength: 100 },
  password: { type: String, required: true },
  imageUrl: { type: String },
  firstName: { type: String, required: true, maxLength: 100 },
  lastName: { type: String, required: true, maxLength: 100 },
  city: { type: String, maxLength: 200 },
  state: { type: String, maxLength: 200 },
  country: { type: String, maxLength: 200 },
  isAdmin: { type: Boolean, required: true, default: false },
  isGuest: { type: Boolean, required: true, default: false },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
})

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

export default model<IUser>("User", UserSchema);