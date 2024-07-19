import { Express, Request, Response } from 'express';
import validateResource from './middleware/validateResource.js';
import requireUser from './middleware/requireUser.js';
import requireAdmin from './middleware/requireAdmin.js';
import { createGuest } from './middleware/createGuest.js';
import { createSessionSchema } from './schemas/session.schema.js';
import { 
  createUserSchema, 
  deleteUserSchema, 
  followUserSchema, 
  getUserSchema, 
  populateUsersSchema, 
  unfollowUserSchema, 
  updateUserSchema 
} from './schemas/user.schema.js';
import { 
  createPostSchema, 
  deletePostSchema, 
  getPostByUserSchema, 
  getPostSchema, 
  likePostSchema, 
  updatePostSchema 
} from './schemas/post.schema.js';
import { 
  createCommentSchema, 
  deleteCommentSchema, 
  getCommentsByPostSchema, 
  getCommentSchema, 
  likeCommentSchema, 
  updateCommentSchema 
} from './schemas/comment.schema.js';
import { 
  createUserSessionHandler, 
  deleteUserSessionHandler, 
  getUserSessionsHandler 
} from './controllers/session.controller.js';
import { 
  createUserHandler, 
  deleteUserHandler, 
  followUserHandler, 
  getSelfHandler, 
  getUserFollowsHandler, 
  getUserHandler, 
  getUserListHandler, 
  populateUsers, 
  unfollowUserHandler, 
  updateUserHandler
} from './controllers/user.controller.js';
import { 
  createPostHandler, 
  deletePostHandler, 
  getFollowedPostsHandler, 
  getPostHandler, 
  getPostsByUserHandler, 
  getRecentPostsHandler, 
  likePostHandler, 
  updatePostHandler 
} from './controllers/post.controller.js';
import { 
  createCommentHandler, 
  deleteCommentHandler, 
  getCommentHandler, 
  getCommentsByPostHandler, 
  likeCommentHandler, 
  updateCommentHandler 
} from './controllers/comment.controller.js';


function routes(app: Express) {
  app.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200));

  // Session Routes
  app.post(
    '/api/v1/sessions', 
    validateResource(createSessionSchema), 
    createUserSessionHandler
  );

  app.get(
    '/api/v1/sessions', 
    requireUser, 
    getUserSessionsHandler
  );

  app.delete(
    '/api/v1/sessions', 
    requireUser, 
    deleteUserSessionHandler
  );

  // Guest Routes
  app.post(
    '/api/v1/guest', 
    [createGuest, validateResource(createSessionSchema)],
    createUserSessionHandler
  );
  
  // User Routes
  app.post(
    '/api/v1/users', 
    validateResource(createUserSchema), 
    createUserHandler
  );

  app.get(
    '/api/v1/users', 
    requireUser,
    getUserListHandler
  );

  app.get(
    '/api/v1/users/self', 
    requireUser,
    getSelfHandler
  );

  app.post(
    '/api/v1/users/populate', 
    [requireAdmin, validateResource(populateUsersSchema)],
    populateUsers
  );

  app.get(
    '/api/v1/users/:userId', 
    [requireUser, validateResource(getUserSchema)],
    getUserHandler
  );

  app.put(
    '/api/v1/users/:userId', 
    [requireUser, validateResource(updateUserSchema)],
    updateUserHandler
  );
  
  app.delete(
    '/api/v1/users/:userId', 
    [requireUser, validateResource(deleteUserSchema)],
    deleteUserHandler
  );

  app.get(
    '/api/v1/users/:userId/posts', 
    [requireUser, validateResource(getPostByUserSchema)],
    getPostsByUserHandler
  );

  app.get(
    '/api/v1/users/:userId/following', 
    [requireUser, validateResource(getUserSchema)],
    getUserFollowsHandler
  );

  app.post(
    '/api/v1/users/:userId/follow', 
    [requireUser, validateResource(followUserSchema)],
    followUserHandler
  );

  app.delete(
    '/api/v1/users/:userId/follow', 
    [requireUser, validateResource(unfollowUserSchema)],
    unfollowUserHandler
  );

  // Post Routes
  app.post(
    '/api/v1/posts',
    [requireUser, validateResource(createPostSchema)], 
    createPostHandler
  );

  app.get(
    '/api/v1/posts',
    requireUser, 
    getRecentPostsHandler
  );

  app.get(
    '/api/v1/posts/following',
    requireUser, 
    getFollowedPostsHandler
  );

  app.get(
    '/api/v1/posts/:postId',
    [requireUser, validateResource(getPostSchema)], 
    getPostHandler
  );

  app.put(
    '/api/v1/posts/:postId',
    [requireUser, validateResource(updatePostSchema)], 
    updatePostHandler
  );

  app.post(
    '/api/v1/posts/:postId/like',
    [requireUser, validateResource(likePostSchema)], 
    likePostHandler
  );

  app.delete(
    '/api/v1/posts/:postId',
    [requireUser, validateResource(deletePostSchema)], 
    deletePostHandler
  );

  // Comment Routes
  app.post(
    '/api/v1/posts/:postId/comments',
    [requireUser, validateResource(createCommentSchema)], 
    createCommentHandler
  );

  app.get(
    '/api/v1/posts/:postId/comments',
    [requireUser, validateResource(getCommentsByPostSchema)], 
    getCommentsByPostHandler
  );

  app.get(
    '/api/v1/posts/:postId/comments/:commentId',
    [requireUser, validateResource(getCommentSchema)], 
    getCommentHandler
  );

  app.put(
    '/api/v1/posts/:postId/comments/:commentId',
    [requireUser, validateResource(updateCommentSchema)],
    updateCommentHandler
  );

  app.delete(
    '/api/v1/posts/:postId/comments/:commentId',
    [requireUser, validateResource(deleteCommentSchema)], 
    deleteCommentHandler
  );

  app.post(
    '/api/v1/posts/:postId/comments/:commentId/like',
    [requireUser, validateResource(likeCommentSchema)], 
    likeCommentHandler
  );
}

export default routes;