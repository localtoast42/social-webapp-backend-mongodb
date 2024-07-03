import jsonwebtoken from 'jsonwebtoken';

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
