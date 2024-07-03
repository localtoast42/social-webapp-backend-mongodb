import fs from 'fs';
import User from '../models/user.js';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

const pathToKey = new URL('../id_rsa_pub.pem', import.meta.url);
const PUB_KEY = fs.readFileSync(pathToKey);

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.APP_SECRET,
  algorithms: ['HS256'],
};

const strategy = new JwtStrategy(options, (payload, done) => {
  User.findOne({ _id: payload.sub })
    .then((user) => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch(err => done(err, null));
});

export default (passport) => {
  passport.use(strategy);
};