import { FilterQuery } from "mongoose";
import SessionModel, { Session, SessionInput } from "../models/session.model.js";

export async function createSession(input: SessionInput) {
  const session = await SessionModel.create(input);

  return session.toJSON();
}

export async function findSessions(query: FilterQuery<Session>) {
  return SessionModel.find(query).lean();
}