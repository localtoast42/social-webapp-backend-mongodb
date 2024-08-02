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
          .post(`/api/v2/posts/${postId}/comments`)
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
          .post(`/api/v2/posts/not_valid_id/comments`)
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
          .post(`/api/v2/posts/${postId}/comments`)
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
          .post(`/api/v2/posts/${postId}/comments`)
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
          .post(`/api/v2/posts/${postId}/comments`)
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

  describe('get comments by post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments`);

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
        
        const findManyCommentsServiceMock = jest
          .spyOn(CommentService, 'findManyComments')
          .mockResolvedValueOnce([commentDocument.toJSON()]);

        const { statusCode, body } = await supertest(app)
          .get(`/api/v2/posts/not_valid_id/comments`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(findManyCommentsServiceMock).not.toHaveBeenCalled();
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
        
        const findManyCommentsServiceMock = jest
          .spyOn(CommentService, 'findManyComments')
          .mockResolvedValueOnce([commentDocument.toJSON()]);

        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(findManyCommentsServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the request is good', () => {
      it('should return a 200 and an array of post comments', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const findManyCommentsServiceMock = jest
          .spyOn(CommentService, 'findManyComments')
          .mockResolvedValueOnce([commentDocument.toJSON()]);

        const { statusCode, body } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual([commentResponse]);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(findManyCommentsServiceMock).toHaveBeenCalled();
      });
    });
  });

  describe('get comment route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments/${commentId}`);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the commentId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid commentId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the comment does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(null);

        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
      });
    });

    describe('given the post does exist', () => {
      it('should return a 200 and the comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(commentResponse);
        expect(body.isLiked).toBe(false);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
      });

      it('should return isLiked as true if user liked the comment', async () => { 
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            likes: [ userObjectId ],
          });

        const { body, statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body.isLiked).toBe(true);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
      });
    });
  });

  describe('update comment route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/${commentId}`)
          .send(updateCommentInput);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the commentId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            text: updateCommentInput.text,
          });

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updateCommentInput);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid commentId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).not.toHaveBeenCalled();
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is logged in and sends empty text', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            text: "",
          });

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ text: "" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Comment must not be empty");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).not.toHaveBeenCalled();
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the comment does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(null);

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            text: updateCommentInput.text,
          });

        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updateCommentInput);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is not the comment author', () => {
      it('should return a 403', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(otherUserDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            text: updateCommentInput.text,
          });

        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updateCommentInput);
        
        expect(statusCode).toBe(403);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the request is good', () => {
      it('should return a 200 and the updated comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            author: userDocument.toJSON(),
            text: updateCommentInput.text,
          });
        
        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            text: updateCommentInput.text,
          });

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updateCommentInput);

        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...commentResponse,
          text: updateCommentInput.text,
         });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).toHaveBeenCalledWith(
          { _id: commentId },
          { ...updateCommentInput, lastEditDate: postDate },
          { new: true },
        );
      });
    });
  });

  describe('delete comment route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .delete(`/api/v2/posts/${postId}/comments/${commentId}`);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the commentId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const deleteCommentServiceMock = jest
          .spyOn(CommentService, 'deleteComment')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode, body } = await supertest(app)
          .delete(`/api/v2/posts/${postId}/comments/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid commentId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(findCommentServiceMock).not.toHaveBeenCalled();
        expect(updatePostServiceMock).not.toHaveBeenCalled();
        expect(deleteCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the comment does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(null);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const deleteCommentServiceMock = jest
          .spyOn(CommentService, 'deleteComment')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode, body } = await supertest(app)
          .delete(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updatePostServiceMock).not.toHaveBeenCalled();
        expect(deleteCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is not the comment author', () => {
      it('should return a 403', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(otherUserDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const deleteCommentServiceMock = jest
          .spyOn(CommentService, 'deleteComment')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode } = await supertest(app)
          .delete(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(403);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updatePostServiceMock).not.toHaveBeenCalled();
        expect(deleteCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the request is good', () => {
      it('should return a 200 and delete the comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce({
            ...postDocument.toJSON(),
            comments: [ commentObjectId ],
            numComments: 1,
          });
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            author: userDocument.toJSON(),
          });

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument);

        const deleteCommentServiceMock = jest
          .spyOn(CommentService, 'deleteComment')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode, body } = await supertest(app)
          .delete(`/api/v2/posts/${postId}/comments/${commentId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          acknowledged: true,
          deletedCount: 1,
          numComments: 0,
        });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId }, 
          { comments: [] }, 
          { new: true }
        );
        expect(deleteCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
      });
    });
  });

  describe('like comment route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the commentId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/not_valid_id/like`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid commentId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).not.toHaveBeenCalled();
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given like input is invalid', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "yes" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Like must be true or false");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).not.toHaveBeenCalled();
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the comment does not exist', () => {
      it('should return a 404', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(null);

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given like=true and the user has not previously liked the comment', () => {
      it('should add the user to likes and return the updated comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...commentResponse,
          likes: [ userId ],
        });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).toHaveBeenCalledWith(
          { _id: commentId },
          { likes: [ userId ] },
          { new: true }
        );
      });
    });

    describe('given like=true and the user has previously liked the comment', () => {
      it('should return the comment with likes unmodified', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            likes: [ userId ],
          });

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...commentResponse,
          likes: [ userId ],
        });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).toHaveBeenCalledWith(
          { _id: commentId },
          { likes: [ userId ] },
          { new: true }
        );
      });
    });

    describe('given like=false and the user has not previously liked the comment', () => {
      it('should return the comment with likes unmodified', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "false" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(commentResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).toHaveBeenCalledWith(
          { _id: commentId },
          { likes: [] },
          { new: true }
        );
      });
    });

    describe('given like=false and the user has previously liked the comment', () => {
      it('should remove the user from likes and return the updated comment', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findCommentServiceMock = jest
          .spyOn(CommentService, 'findComment')
          .mockResolvedValueOnce({
            ...commentDocument.toJSON(),
            likes: [ userId ],
          });

        const updateCommentServiceMock = jest
          .spyOn(CommentService, 'findAndUpdateComment')
          .mockResolvedValueOnce(commentDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/comments/${commentId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "false" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(commentResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findCommentServiceMock).toHaveBeenCalledWith({ _id: commentId });
        expect(updateCommentServiceMock).toHaveBeenCalledWith(
          { _id: commentId },
          { likes: [] },
          { new: true }
        );
      });
    });
  });
});