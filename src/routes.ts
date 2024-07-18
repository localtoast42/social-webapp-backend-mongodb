import { Express, Request, Response } from 'express';
import validateResource from './middleware/validateResource.js';
import requireUser from './middleware/requireUser.js';
import requireAdmin from './middleware/requireAdmin.js';
import { createSessionSchema } from './schemas/session.schema.js';
import { createUserSchema } from './schemas/user.schema.js';
import { createPostSchema, updatePostSchema } from './schemas/post.schema.js';
import { createCommentSchema } from './schemas/comment.schema.js';
import { createGuest } from './middleware/createGuest.js';
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
  getRecentPostsHandler, 
  likePostHandler, 
  updatePostHandler 
} from './controllers/post.controller.js';
import { 
  createCommentHandler, 
  deleteCommentHandler, 
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

  app.post(
    '/api/v1/users', 
    validateResource(createUserSchema), 
    createUserHandler
  );

  app.get(
    '/api/v1/users/:userId', 
    requireUser,
    getUserHandler
  );

  app.get(
    '/api/v1/users/self', 
    requireUser,
    getSelfHandler
  );

  app.get(
    '/api/v1/users', 
    requireUser,
    getUserListHandler
  );

  app.put(
    '/api/v1/users/:userId', 
    requireUser,
    updateUserHandler
  );
  
  app.delete(
    '/api/v1/users/:userId', 
    requireUser,
    deleteUserHandler
  );

  app.get(
    '/api/v1/users/:userId/posts', 
    requireUser,
    
  );

  app.get(
    '/api/v1/users/:userId/following', 
    requireUser,
    getUserFollowsHandler
  );

  app.post(
    '/api/v1/users/:userId/follow', 
    requireUser,
    followUserHandler
  );

  app.delete(
    '/api/v1/users/:userId/follow', 
    requireUser,
    unfollowUserHandler
  );

  app.post(
    '/api/v1/users/populate', 
    requireAdmin,
    populateUsers
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
    requireUser, 
    getPostHandler
  );

  app.put(
    '/api/v1/posts/:postId',
    [requireUser, validateResource(updatePostSchema)], 
    updatePostHandler
  );

  app.post(
    '/api/v1/posts/:postId/like',
    requireUser, 
    likePostHandler
  );

  app.delete(
    '/api/v1/posts/:postId',
    requireUser, 
    deletePostHandler
  );

  // Comment Routes
  app.post(
    '/api/v1/posts/:postId/comments',
    [requireUser, validateResource(createCommentSchema)], 
    createCommentHandler
  );

  app.put(
    '/api/v1/posts/:postId/comments/:commentId',
    requireUser, 
    updateCommentHandler
  );

  app.delete(
    '/api/v1/posts/:postId/comments/:commentId',
    requireUser, 
    deleteCommentHandler
  );

  app.post(
    '/api/v1/posts/:postId/comments/:commentId/like',
    requireUser, 
    likeCommentHandler
  );
}

export default routes;