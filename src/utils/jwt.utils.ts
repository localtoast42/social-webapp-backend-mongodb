import jwt from 'jsonwebtoken';
import config from 'config';

const appSecret = config.get<string>("accessTokenSecret");

export function signJwt(
  object: Object, 
  options?: jwt.SignOptions | undefined
) {
  return jwt.sign(object, appSecret, {
    ...(options && options),
    algorithm: 'HS256',
  });
}

export function verifyJwt(token: string) {
  try {
    const decoded = jwt.verify(token, appSecret);

    return {
      valid: true,
      expired: false,
      decoded: decoded
    }
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message === 'jwt expired',
      decoded: null
    }
  }
}