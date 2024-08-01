import { Request, Response } from 'express';
import config from 'config';
import { signJwt } from '../utils/jwt.utils';
import { validatePassword } from '../services/user.service';
import { createSession, findSessions, updateSession } from '../services/session.service';
import { CreateSessionInput } from '../schemas/session.schema';

export async function createUserSessionHandler(
  req: Request<{}, {}, CreateSessionInput["body"]>, 
  res: Response
) {
  const user = await validatePassword(req.body)

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  const session = await createSession({
    user: user.id, 
    userAgent: req.get("user-agent") || "",
  });

  const accessToken = signJwt(
    { ...user, session: session._id },
    "accessTokenSecret",
    { expiresIn: config.get<string>("accessTokenTtl") },
  );

  const refreshToken = signJwt(
    { ...user, session: session._id },
    "refreshTokenSecret",
    { expiresIn: config.get<string>("refreshTokenTtl") },
  );

  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
}

export async function deleteUserSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.user.session;

  await updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null
  });
}