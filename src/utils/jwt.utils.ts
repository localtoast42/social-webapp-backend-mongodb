import jwt from 'jsonwebtoken';
import config from 'config';

export function signJwt(
  object: Object, 
  secretName: "accessTokenSecret" | "refreshTokenSecret",
  options?: jwt.SignOptions | undefined
) {
  const appSecret = config.get<string>(secretName);

  return jwt.sign(object, appSecret, {
    ...(options && options),
    algorithm: 'HS256',
  });
}

export function verifyJwt(
  token: string,
  secretName: "accessTokenSecret" | "refreshTokenSecret"
) {
  const appSecret = config.get<string>(secretName);

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