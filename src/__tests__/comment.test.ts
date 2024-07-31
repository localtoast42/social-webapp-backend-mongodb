import supertest from 'supertest';
import mongoose from 'mongoose';
import createServer from '../utils/server';
import * as UserService from '../services/user.service';
import * as PostService from '../services/post.service';
import * as CommentService from '../services/comment.service';
import { signJwt } from '../utils/jwt.utils';
import PostModel from '../models/post.model';
import UserModel from '../models/user.model';
import CommentModel from '../models/comment.model';

jest.mock('../utils/logger');

const app = createServer();

const userObjectId = new mongoose.Types.ObjectId();
const userId = userObjectId.toString();

const otherUserObjectId = new mongoose.Types.ObjectId();
const otherUserId = otherUserObjectId.toString();

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

const otherUserPayload = {
  _id: otherUserObjectId,
  id: otherUserId,
  username: "otheruser",
  firstName: "other",
  lastName: "user",
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

const otherUserDocument = new UserModel(otherUserPayload);

const postObjectId = new mongoose.Types.ObjectId();
const postId = postObjectId.toString();
const commentObjectId = new mongoose.Types.ObjectId();
const commentId = commentObjectId.toString();
const postDate = new Date(2024, 8, 1);

const postPayload = {
  _id: postObjectId,
  id: postId,
  author: { ...userPayload },
  text: "Test post",
  postDate: postDate,
  lastEditDate: postDate,
  isPublicPost: true,
  likes: [],
  comments: [],
};

const postDocument = new PostModel(postPayload);

const commentInput = {
  text: "Test comment",
};

const updateCommentInput = {
  text: "Test comment (updated)",
};

const commentPayload = {
  _id: commentObjectId,
  id: commentId,
  author: { ...userPayload },
  post: { ...postPayload },
  text: "Test comment",
  postDate: postDate,
  lastEditDate: postDate,
  isPublicComment: true,
  likes: [],
  comments: [],
};

const commentDocument = new CommentModel(commentPayload);

const commentResponse = {
  ...commentDocument.toJSON(),
  "_id": commentId,
  "author": userId,
  "post": postId,
  "postDate": postDate.toJSON(),
  "lastEditDate": postDate.toJSON(),
};

const jwt = signJwt(userPayload, 'accessTokenSecret');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 8, 1));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('comment', () => {
  describe('create comment route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .send(commentInput);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the postId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const createCommentServiceMock = jest
          .spyOn(CommentService, 'createComment')
          .mockResolvedValueOnce(commentDocument);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/not_valid_id/comments`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(commentInput);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(createCommentServiceMock).not.toHaveBeenCalled();
        expect(updatePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is logged in and sends empty text', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const createCommentServiceMock = jest
          .spyOn(CommentService, 'createComment')
          .mockResolvedValueOnce(commentDocument);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ text: "" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Comment must not be empty");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(createCommentServiceMock).not.toHaveBeenCalled();
        expect(updatePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the post does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(null);
        
        const createCommentServiceMock = jest
          .spyOn(CommentService, 'createComment')
          .mockResolvedValueOnce(commentDocument);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const { statusCode } = await supertest(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(commentInput);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(createCommentServiceMock).not.toHaveBeenCalled();
        expect(updatePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is logged in and sends text', () => {
      it('should return a 201 and create the comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const createCommentServiceMock = jest
          .spyOn(CommentService, 'createComment')
          .mockResolvedValueOnce(commentDocument);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(commentInput);

        expect(statusCode).toBe(201);
        expect(body).toEqual(commentResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(createCommentServiceMock).toHaveBeenCalledWith({
          ...commentInput,
          post: postObjectId,
          author: userObjectId, 
          postDate: postDate,
          isPublicComment: !userPayload.isGuest,
        });
        expect(updatePostServiceMock).toHaveBeenCalled();
      });
    });
  });
});