import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';

const pathToKey = new URL('../id_rsa_priv.pem', import.meta.url);
const PRIV_KEY = fs.readFileSync(pathToKey);

export function issueJWT(user) {
  const _id = user._id;

  const expiresIn = '1d';

  const payload = {
    sub: _id,
    iat: Date.now()
  };

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn
  }
};
