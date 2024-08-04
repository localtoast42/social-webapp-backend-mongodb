import { NextFunction, Request, Response } from "express";
import { faker } from "@faker-js/faker";
import logger from "../utils/logger";
import { UserCreate } from "../models/user.model";
import { createUser } from "../services/user.service";

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
    isGuest: true,
  };

  try {
    const user = await createUser(userInput);
    req.body.username = user.username;
    req.body.password = userInput.password;
    logger.info(`Guest user ${user.username} created`);
    return next();
  } catch (e: any) {
    logger.error(e);
    return res.status(409).send(e.message);
  }
}
