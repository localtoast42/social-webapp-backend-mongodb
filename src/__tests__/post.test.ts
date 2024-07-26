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
          .get(`/api/v1/posts/${postId}`);
          
        expect(statusCode).toBe(401);
      });
    });

    describe('given the postId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const { statusCode, body } = await supertest(app)
          .get(`/api/v1/posts/not_valid_id`)
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

      it('should return isLiked as true if user liked the post', async () => { 
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockReturnValueOnce({
            ...postDocument.toJSON(),
            // @ts-ignore
            likes: [ userObjectId ],
          });

        const { body, statusCode } = await supertest(app)
          .get(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${jwt}`);
        
        expect(statusCode).toBe(200);
        expect(body.isLiked).toBe(true);
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

    describe('given the user is logged in and sends empty text', () => {
      it('should return a 400 with error message', async () => {
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

  describe('update post route', () => {
    describe('given the user is not logged in', () => {
      it('should return a 401', async () => {   
        const { statusCode } = await supertest(app)
          .put(`/api/v1/posts/${postId}`)
          .send(updatePostInput);
          
        expect(statusCode).toBe(401);
      });
    });

    describe('given the postId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const { statusCode, body } = await supertest(app)
          .put(`/api/v1/posts/not_valid_id`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const createPostServiceMock = jest
          .spyOn(PostService, 'createPost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .put(`/api/v1/posts/${postId}`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(null);

        const { statusCode } = await supertest(app)
          .put(`/api/v1/posts/${postId}`)
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
          // @ts-ignore
          .mockReturnValueOnce({ ...userPayload, id: otherUserId });
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const { statusCode } = await supertest(app)
          .put(`/api/v1/posts/${postId}`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);

        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);
        
        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockReturnValueOnce({
            ...postDocument.toJSON(),
            // @ts-ignore
            text: updatePostInput.text,
          });

        const { statusCode, body } = await supertest(app)
          .put(`/api/v1/posts/${postId}`)
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
          .post(`/api/v1/posts/${postId}/like`)
          .send({ like: "true" });
          
        expect(statusCode).toBe(401);
      });
    });

    describe('given the postId is not a valid ObjectId', () => {
      it('should return a 400 with error message', async () => {
        const findUserServiceMock = jest
          .spyOn(UserService, 'findUser')
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/not_valid_id/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(null);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockReturnValueOnce({
            ...postDocument.toJSON(),
            // @ts-ignore
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockReturnValueOnce({
            ...postPayload,
            // @ts-ignore
            likes: [ userId ],
          });

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          .mockReturnValueOnce({
            ...postDocument.toJSON(),
            // @ts-ignore
            likes: [ userId ],
          });

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          // @ts-ignore
          .mockReturnValueOnce(postPayload);

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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
          // @ts-ignore
          .mockReturnValueOnce(userPayload);
        
        const findPostServiceMock = jest
          .spyOn(PostService, 'findPost')
          .mockReturnValueOnce({
            ...postPayload,
            // @ts-ignore
            likes: [ userId ],
          });

        const updatePostServiceMock = jest
          .spyOn(PostService, 'findAndUpdatePost')
          // @ts-ignore
          .mockReturnValueOnce(postDocument.toJSON());

        const { statusCode, body } = await supertest(app)
          .post(`/api/v1/posts/${postId}/like`)
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

  });
});