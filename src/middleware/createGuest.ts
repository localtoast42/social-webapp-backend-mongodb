import { NextFunction, Request, Response } from 'express';
import { faker } from '@faker-js/faker';
import logger from '../utils/logger.js';
import { UserCreate } from '../models/user.model.js';
import { createUser } from '../services/user.service.js';

export async function createGuest(
  req: Request, 
  res: Response,
  next: NextFunction
) {
  const guestNum = faker.string.alphanumeric(8);

  const userInput: UserCreate = {
    username: `Guest_#${guestNum}`,
    password: "guest",
    firstName: "Guest",
    lastName: `#${guestNum}`,
  }

  try {
    const user = await createUser(userInput);
    req.body.username = user.username;
    req.body.password = userInput.password;
    return next();
  } catch (e: any) {
    logger.error(e);
    return res.status(409).send(e.message);
  }
}