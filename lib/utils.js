import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';

// const pathToKey = new URL('../id_rsa_priv.pem', import.meta.url);
// const PRIV_KEY = fs.readFileSync(pathToKey);

export function issueJWT(user) {
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
