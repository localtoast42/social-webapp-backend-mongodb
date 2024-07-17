import { Request, Response } from 'express';
import config from 'config';
import { signJwt } from '../utils/jwt.utils.js';
import { validatePassword } from '../services/user.service.js';
import { createSession } from '../services/session.service.js';

export async function createUserSessionHandler(req: Request, res: Response) {
  const user = await validatePassword(req.body)

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  const session = await createSession({
    user: user._id, 
    userAgent: req.get("user-agent") || "",
  });

  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get<string>("accessTokenTtl") },
  );

  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get<string>("refreshTokenTtl") },
  );

  return res.send({ accessToken, refreshToken });
}
