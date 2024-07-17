import { Express, Request, Response } from 'express';
import validateResource from './middleware/validateResource.js';
import requireUser from './middleware/requireUser.js';
import { 
  createUserSessionHandler, 
  deleteUserSessionHandler, 
  getUserSessionsHandler 
} from './controllers/session.controller.js';
import { createUserHandler } from './controllers/user.controller.js';
import { createPostHandler } from './controllers/post.controller.js';
import { createCommentHandler } from './controllers/comment.controller.js';
import { createSessionSchema } from './schemas/session.schema.js';
import { createUserSchema } from './schemas/user.schema.js';
import { createPostSchema } from './schemas/post.schema.js';
import { createCommentSchema } from './schemas/comment.schema.js';

function routes(app: Express) {
  app.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200));

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
  
  app.post(
    '/api/v1/users', 
    validateResource(createUserSchema), 
    createUserHandler
  );

  app.post(
    '/api/v1/posts',
    [requireUser, validateResource(createPostSchema)], 
    createPostHandler
  );

  app.post(
    '/api/v1/posts/:postId/comments',
    [requireUser, validateResource(createCommentSchema)], 
    createCommentHandler
  );
}

export default routes;