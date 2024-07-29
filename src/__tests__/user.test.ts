import supertest from 'supertest';
import config from 'config';
import mongoose from 'mongoose';
import createServer from '../utils/server';
import { signJwt } from '../utils/jwt.utils';
import UserModel from '../models/user.model';
import * as UserService from '../services/user.service';

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

const jwt = signJwt(userPayload, 'accessTokenSecret');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 8, 1));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('user', () => {
  describe('create user route', () => {
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
  });

  describe('get user route', () => {

  });

  describe('get self route', () => {

  });

  describe('get user list route', () => {

  });

  describe('update user route', () => {

  });

  describe('delete user route', () => {

  });

  describe('get user follows route', () => {

  });

  describe('follow user route', () => {

  });

  describe('unfollow user route', () => {

  });

  describe('populate user route', () => {

  });
});