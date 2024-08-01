import mongoose from "mongoose";
import { User } from "./user.model";

export interface SessionInput {
  user: User["id"];
  userAgent: string;
}

export interface Session extends SessionInput {
  valid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

const SessionModel = mongoose.model<Session>("Session", sessionSchema);

export default SessionModel;