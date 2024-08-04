import supertest from 'supertest';
import mongoose from 'mongoose';
import createServer from '../utils/server';
import * as UserService from '../services/user.service';
import * as PostService from '../services/post.service';
import * as CommentService from '../services/comment.service';
import { signJwt } from '../utils/jwt.utils';
import PostModel from '../models/post.model';
import UserModel from '../models/user.model';

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
const postDate = new Date(2024, 8, 1);

const postInput = {
  text: "Test post",
};

const updatePostInput = {
  text: "Test post (updated)",
};

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

const postResponse = {
  ...postDocument.toJSON(),
  "_id": postId,
  "author": userId,
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

describe('post', () => {
  describe('get post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}`);
          
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

        const { statusCode, body } = await supertest(app)
          .get(`/api/v2/posts/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
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

        const { statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}`)
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
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { body, statusCode } = await supertest(app)
          .get(`/api/v2/posts/${postId}`)
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
          .post('/api/v2/posts')
          .send(postInput);

        expect(statusCode).toBe(401);
      });
    });

    describe('given the user is logged in and sends empty text', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const createPostServiceMock = jest
          .spyOn(PostService, 'createPost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post('/api/v2/posts')
          .set('Authorization', `Bearer ${jwt}`)
          .send({ text: "" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Post must not be empty");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(createPostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is logged in and sends text', () => {
      it('should return a 201 and create the post', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const createPostServiceMock = jest
          .spyOn(PostService, 'createPost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post('/api/v2/posts')
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

  describe('update post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}`)
          .send(updatePostInput);
          
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
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updatePostInput);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user sends empty text', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const createPostServiceMock = jest
          .spyOn(PostService, 'createPost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ text: "" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Post must not be empty");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(createPostServiceMock).not.toHaveBeenCalled();
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

        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updatePostInput);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
      });
    });

    describe('given the user is not the post author', () => {
      it('should return a 403', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(otherUserDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const { statusCode } = await supertest(app)
          .put(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updatePostInput);
        
        expect(statusCode).toBe(403);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
      });
    });

    describe('given the user is logged in', () => {
      it('should return a 200 and the updated post', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);
        
        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce({
            ...postDocument.toJSON(),
            text: updatePostInput.text,
          });

        const { statusCode, body } = await supertest(app)
          .put(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`)
          .send(updatePostInput);

        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...postResponse,
          text: updatePostInput.text,
         });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId },
          { ...updatePostInput, lastEditDate: postDate },
          { new: true },
        );
      });
    });
  });

  describe('like post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .send({ like: "true" });
          
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
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/not_valid_id/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(updatePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given like input is invalid', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "yes" });
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Like must be true or false");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
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

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given like=true and the user has not previously liked the post', () => {
      it('should add the user to likes and return the updated post', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce({
            ...postDocument.toJSON(),
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...postResponse,
          likes: [ userId ],
        });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId },
          { likes: [ userId ] },
          { new: true }
        );
      });
    });

    describe('given like=true and the user has previously liked the post', () => {
      it('should return the post with likes unmodified', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce({
            ...postPayload,
            likes: [ userId ],
          });

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce({
            ...postDocument.toJSON(),
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "true" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({ 
          ...postResponse,
          likes: [ userId ],
        });
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId },
          { likes: [ userId ] },
          { new: true }
        );
      });
    });

    describe('given like=false and the user has not previously liked the post', () => {
      it('should return the post with likes unmodified', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "false" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(postResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId },
          { likes: [] },
          { new: true }
        );
      });
    });

    describe('given like=false and the user has previously liked the post', () => {
      it('should remove the user from likes and return the updated post', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce({
            ...postPayload,
            likes: [ userId ],
          });

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockResolvedValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v2/posts/${postId}/like`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({ like: "false" });
        
        expect(statusCode).toBe(200);
        expect(body).toEqual(postResponse);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(updatePostServiceMock).toHaveBeenCalledWith(
          { _id: postId },
          { likes: [] },
          { new: true }
        );
      });
    });
  });

  describe('delete post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .delete(`/api/v2/posts/${postId}`);
          
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
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const deleteManyCommentsServiceMock = jest
          .spyOn(CommentService, 'deleteManyComments')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 2,
          });
        
        const deletePostServiceMock = jest
          .spyOn(PostService, 'deletePost')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode, body } = await supertest(app)
          .delete(`/api/v2/posts/not_valid_id`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(400);
        expect(body[0].message).toEqual("Invalid postId");
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).not.toHaveBeenCalled();
        expect(deleteManyCommentsServiceMock).not.toHaveBeenCalled();
        expect(deletePostServiceMock).not.toHaveBeenCalled();
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

        const deleteManyCommentsServiceMock = jest
          .spyOn(CommentService, 'deleteManyComments')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 2,
          });
        
        const deletePostServiceMock = jest
          .spyOn(PostService, 'deletePost')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode } = await supertest(app)
          .delete(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(404);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(deleteManyCommentsServiceMock).not.toHaveBeenCalled();
        expect(deletePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given the user is not the post author', () => {
      it('should return a 403', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(otherUserDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const deleteManyCommentsServiceMock = jest
          .spyOn(CommentService, 'deleteManyComments')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 2,
          });
        
        const deletePostServiceMock = jest
          .spyOn(PostService, 'deletePost')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode } = await supertest(app)
          .delete(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(403);
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(deleteManyCommentsServiceMock).not.toHaveBeenCalled();
        expect(deletePostServiceMock).not.toHaveBeenCalled();
      });
    });

    describe('given user is logged in and request is valid', () => {
      it('should delete the post and comments and return number deleted', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          .mockResolvedValueOnce(userDocument);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockResolvedValueOnce(postPayload);

        const deleteManyCommentsServiceMock = jest
          .spyOn(CommentService, 'deleteManyComments')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 2,
          });
        
        const deletePostServiceMock = jest
          .spyOn(PostService, 'deletePost')
          .mockResolvedValueOnce({ 
            acknowledged: true,
            deletedCount: 1,
          });

        const { statusCode, body } = await supertest(app)
          .delete(`/api/v2/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body).toEqual({
          posts_deleted: 1,
          comments_deleted: 2,
        })
        expect(findUserServiceMock).toHaveBeenCalledWith({ _id: userId });
        expect(findPostServiceMock).toHaveBeenCalledWith({ _id: postId });
        expect(deleteManyCommentsServiceMock).toHaveBeenCalledWith({ post: postId });
        expect(deletePostServiceMock).toHaveBeenCalledWith({ _id: postId });
      });
    });
  });
});