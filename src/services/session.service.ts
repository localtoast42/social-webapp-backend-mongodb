import SessionModel, { SessionInput } from "../models/session.model.js";

export async function createSession(input: SessionInput) {
  const session = await SessionModel.create(input);

  return session.toJSON();
}