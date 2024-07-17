import { Schema, Types, model } from 'mongoose';
import bcrypt from 'bcrypt';
import config from 'config';

export interface UserInput {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  city?: string;
  state?: string;
  country?: string;
};

export interface User extends UserInput {
  id: Types.ObjectId;
  imageUrl?: string;
  isAdmin: boolean;
  isGuest: boolean;
  followers: Array<Types.ObjectId>;
  following: Array<Types.ObjectId>;
  followedByMe: boolean;
  fullName: string;
  url: string;
  comparePassword(candidatePassword: string): Promise<Boolean>;
};

const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true, minLength: 3, maxLength: 100 },
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
});

userSchema.pre("save", async function (next) {
  let user = this;

  if (!user.isModified("password")) {
    return next();
  }

  bcrypt.hash(user.password, config.get<number>("saltWorkFactor"), async (err, hashedPassword) => {
    if (err) {
      next(err);
    }

    user.password = hashedPassword;
  });

  return next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  let user = this;

  return bcrypt.compare(candidatePassword, user.password).catch((e) => false);
};

userSchema.virtual("fullName").get(function () {
  let fullName = "";
  if (this.firstName && this.lastName) {
    fullName = `${this.firstName} ${this.lastName}`;
  }

  return fullName;
});

userSchema.virtual("url").get(function () {
  return `/users/${this._id}`;
});

const UserModel = model<User>("User", userSchema);

export default UserModel;