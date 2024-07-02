import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import { issueJWT } from '../lib/utils.js';

export const login = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json(
        { 
          success: false, 
          username: {
            msg: "User not found, try different username" 
          }
        }
      );
    };
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json(
        { 
          success: false, 
          password: {
            msg: "Incorrect password" 
          }
        }
      );
    }
    const tokenObject = issueJWT(user);
    res
      .status(200)
      .json({ success: true, token: tokenObject.token, expiresIn: tokenObject.expires });
  } catch(err) {
    return next(err);
  }
});