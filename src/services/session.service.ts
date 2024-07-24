import { FilterQuery, UpdateQuery } from "mongoose";
import { get, omit } from 'lodash';
import config from "config";
import SessionModel, { Session, SessionInput } from "../models/session.model";
import { signJwt, verifyJwt } from "../utils/jwt.utils";
import { findUser } from "./user.service";

export async function createSession(input: SessionInput) {
  const session = await SessionModel.create(input);

  return session.toJSON();
}

export async function findSessions(query: FilterQuery<Session>) {
  return SessionModel.find(query).lean();
}

export async function updateSession(
  query: FilterQuery<Session>, 
  update: UpdateQuery<Session>
) {
  return SessionModel.updateOne(query, update);
}

export async function reIssueAccessToken({
  refreshToken
}: {
  refreshToken: string
}) {
  const { decoded } = verifyJwt(refreshToken, "refreshTokenSecret");

  if (!decoded || !get(decoded, '_id')) return '';

  const session = await SessionModel.findById(get(decoded, "session"));

  if (!session || !session.valid) return '';

  const result = await findUser({ _id: session.user.toString() });

  if (!result) return '';

  const user = omit(result.toJSON(), "password");

  const accessToken = signJwt(
    { ...user, session: session._id },
    "accessTokenSecret",
    { expiresIn: config.get<string>("accessTokenTtl") },
  );

  return accessToken;
}