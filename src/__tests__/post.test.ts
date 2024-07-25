import supertest from 'supertest';
import mongoose from 'mongoose';
import createServer from '../utils/server';
import * as UserService from '../services/user.service';
import * as PostService from '../services/post.service';
import { signJwt } from '../utils/jwt.utils';
import PostModel from '../models/post.model';

jest.mock('../utils/logger');

const app = createServer();

const userObjectId = new mongoose.Types.ObjectId();
const userId = userObjectId.toString();

const postObjectId = new mongoose.Types.ObjectId();
const postId = postObjectId.toString();
const postDate = new Date(2024, 8, 1);

const postInput = {
  text: "Test post",
};

const postPayload = {
  _id: postObjectId,
  id: postId,
  author: userId,
  text: "Test post",
  postDate: postDate,
  lastEditDate: postDate,
  isPublicPost: true,
  likes: [],
  comments: [],
};

const postDocument = new PostModel(postPayload);

const postResponse = {
  ...postDocument.toJSON(),
  "_id": postId,
  "author": userId,
  "postDate": postDate.toJSON(),
  "lastEditDate": postDate.toJSON(),
};

const userPayload = {
  _id: userObjectId,
  id: userId,
  username: "testuser",
  firstName: "first",
  lastName: "last",
  fullName: "first last",
  city: "",
  state: "",
  country: "",
  imageUrl: "",
  isAdmin: false,
  isGuest: false,
  followers: [],
  following: [],
  followedByMe: false,
  hasFollows: false,
  url: "",
};

const jwt = signJwt(userPayload, 'accessTokenSecret');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 8, 1));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('post', () => {
  describe('get post route', () => {
    describe('given the post does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(null);

        const { statusCode } = await supertest(app)
          .get(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
      });
    });

    describe('given the post does exist', () => {
      it('should return a 200 status and the post', async () => { 
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { body, statusCode } = await supertest(app)
          .get(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(postResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
      });
    });
  });
  
  describe('create post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .post('/api/v1/posts')
          .send(postInput);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the user is logged in', () => {
      it('should return a 201 and create the post', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const createPostServiceMock = jest
          .spyOn(PostService, 'createPost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${jwt}`)
          .send(postInput);

        expect(statusCode).toBe(201);
        expect(body).toEqual(postResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(createPostServiceMock).toHaveBeenCalledWith({
          ...postInput,
          author: userObjectId, 
          postDate: postDate,
          isPublicPost: !userPayload.isGuest,
        });
      });
    });
  });
});