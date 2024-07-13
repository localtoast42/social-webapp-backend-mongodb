import jsonwebtoken from 'jsonwebtoken';
import { IUser } from '../models/user.js';
import { HydratedDocument } from 'mongoose';

interface tokenObject {
  token: string;
  expires: string;
}

export function issueJWT(user: HydratedDocument<IUser>): tokenObject {
  const expiresIn = '1d';

  const payload = {
    sub: user._id,
  };

  const signedToken = jsonwebtoken.sign(payload, process.env.APP_SECRET, { expiresIn: expiresIn, algorithm: 'HS256' });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn
  }
};
