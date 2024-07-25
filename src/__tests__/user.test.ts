import supertest from 'supertest';
import config from 'config';
import mongoose from 'mongoose';
import * as UserService from '../services/user.service';
import * as SessionService from '../services/session.service';
import createServer from '../utils/server';
import UserModel from '../models/user.model';
import { signJwt } from '../utils/jwt.utils';
import SessionModel from '../models/session.model';
import { createUserSessionHandler } from '../controllers/session.controller';

jest.mock('../utils/logger');

const app = createServer();

const allowNewPublicUsers = config.get<boolean>('allowNewPublicUsers');

const userObjectId = new mongoose.Types.ObjectId();
const userId = userObjectId.toString();

const userInput = {
  username: "testuser",
  firstName: "first",
  lastName: "last",
  password: "testpwd",
  passwordConfirmation: "testpwd",
  city: "",
  state: "",
  country: "",
  imageUrl: "",
};

const userPayload = {
  _id: userObjectId,
  id: userId,
  username: "testuser",
  firstName: "first",
  lastName: "last",
  city: "",
  state: "",
  country: "",
  imageUrl: "",
  isAdmin: false,
  isGuest: false,
  followers: [],
  following: [],
};

const userDocument = new UserModel(userPayload);

const userResponse = {
  ...userDocument.toJSON(),
  "_id": userId,
};

const sessionPayload = {
  _id: new mongoose.Types.ObjectId(),
  user: userId,
  valid: true,
  userAgent: "PostmanRuntime/7.39.0",
};

const sessionDocument = new SessionModel(sessionPayload);

const jwt = signJwt(userPayload, 'accessTokenSecret');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 8, 1));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('user', () => {
  describe('user registration', () => {
    describe('given the username and password are valid', () => {
      it('should return the user payload', async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, 'createUser')
          // @ts-ignore
          .mockReturnValueOnce(userDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post('/api/v1/users')
          .send(userInput);

        expect(statusCode).toBe(200);
        expect(body).toEqual(userResponse);
        expect(createUserServiceMock).toHaveBeenCalledWith({
          ...userInput,
          isGuest: !allowNewPublicUsers,
        });
      });
    });

    describe('given the passwords do not match', () => {
      it('should return a 400', async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, 'createUser')
          // @ts-ignore
          .mockReturnValueOnce(userDocument.toJSON());
        
        const { statusCode } = await supertest(app)
          .post('/api/v1/users')
          .send({ ...userInput, passwordConfirmation: "doesnotmatch" });

        expect(statusCode).toBe(400);
        expect(createUserServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user service throws', () => {
      it('should return a 409', async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, 'createUser')
          // @ts-ignore
          .mockRejectedValueOnce("did not work");

        const { statusCode } = await supertest(app)
          .post('/api/v1/users')
          .send(userInput);

        expect(statusCode).toBe(409);
        expect(createUserServiceMock).toHaveBeenCalled();
      });
    });
  })
  
  describe('create user session', () => {
    describe('given the username and password are valid', () => {
      it('should return a signed accessToken and refreshToken', async () => {
        jest.spyOn(UserService, 'validatePassword')
          .mockReturnValue(userDocument.toJSON());

        jest.spyOn(SessionService, 'createSession')
          .mockReturnValue(sessionDocument.toJSON());

        const req = {
          get: () => {
            return "a user agent";
          },
          body: {
            username: userInput.username,
            password: userInput.password,
          },
        };

        const send = jest.fn();

        const res = {
          send,
        };

        // @ts-ignore
        await createUserSessionHandler(req, res);

        expect(send).toHaveBeenCalledWith({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      });
    });
  });
});