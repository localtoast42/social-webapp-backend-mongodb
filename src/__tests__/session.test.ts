import supertest from 'supertest';
import mongoose from 'mongoose';
import createServer from '../utils/server';
import UserModel from '../models/user.model';
import SessionModel from '../models/session.model';
import * as UserService from '../services/user.service';
import * as SessionService from '../services/session.service';
import { createUserSessionHandler } from '../controllers/session.controller';
import { signJwt } from '../utils/jwt.utils';

const app = createServer();

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

const sessionPayload = {
  _id: new mongoose.Types.ObjectId(),
  user: userId,
  valid: true,
  userAgent: "PostmanRuntime/7.39.0",
};

const sessionDocument = new SessionModel(sessionPayload);

const jwt = signJwt(userPayload, 'accessTokenSecret');

describe('session', () => {
  describe('create session route', () => {
    describe('given required fields are not included in request body', () => {
      it('should return a 400 with error message', async () => {
        const validatePasswordServiceMock = jest
          .spyOn(UserService, 'validatePassword')
          // @ts-ignore
          .mockResolvedValueOnce(userDocument.toJSON());

        const createSessionServiceMock = jest
          .spyOn(SessionService, 'createSession')
          .mockResolvedValueOnce(sessionDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post('/api/v1/sessions')
          .send({});
          
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Username is required");
        expect(body[1].message).toEqual("Password is required");
        expect(validatePasswordServiceMock).not.toHaveBeenCalled();
        expect(createSessionServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given validatePassword returns false', () => {
      it('should return a 401 with error message', async () => {
        const validatePasswordServiceMock = jest
          .spyOn(UserService, 'validatePassword')
          // @ts-ignore
          .mockResolvedValueOnce(false);

        const createSessionServiceMock = jest
          .spyOn(SessionService, 'createSession')
          .mockResolvedValueOnce(sessionDocument.toJSON());

        const { statusCode } = await supertest(app)
          .post('/api/v1/sessions')
          .send({
            username: "",
            password: "",
          });
          
        expect(statusCode).toBe(401);
        expect(validatePasswordServiceMock).toHaveBeenCalled();
        expect(createSessionServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the username and password are valid', () => {
      it('should return a signed accessToken and refreshToken', async () => {
        jest.spyOn(UserService, 'validatePassword')
          // @ts-ignore
          .mockResolvedValueOnce(userDocument.toJSON());

        jest.spyOn(SessionService, 'createSession')
          .mockResolvedValueOnce(sessionDocument.toJSON());

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

  describe('get sessions route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .get('/api/v1/sessions');
          
        expect(statusCode).toBe(401);
      });
    });

    describe('given the request is good', () => {
      it('should return a 200 and the array of user sessions', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findSessionsServiceMock = jest
          .spyOn(SessionService, 'findSessions')
          .mockResolvedValueOnce([sessionDocument.toJSON()]);

        const { body, statusCode } = await supertest(app)
          .get('/api/v1/sessions')
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual([{
          ...sessionPayload,
          _id: sessionPayload._id.toString(),
        }]);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findSessionsServiceMock).toHaveBeenCalled();
      })
    })
  })
});