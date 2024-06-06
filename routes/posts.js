import express from 'express';
import passport from 'passport';
import commentsRouter from './comments.js';
import * as postController from '../controllers/postController.js';

const postsRouter = express.Router();

postsRouter.use('/:postId/comments', commentsRouter);

postsRouter.get('/', 
  passport.authenticate('jwt', { session: false }),
  postController.get_posts
);

postsRouter.post('/', 
  passport.authenticate('jwt', { session: false }),
  postController.post_create
);

postsRouter.get('/:postId', 
  passport.authenticate('jwt', { session: false }),
  postController.post_get
);

postsRouter.put('/:postId', 
  passport.authenticate('jwt', { session: false }),
  postController.post_update
);

postsRouter.delete('/:postId', 
  passport.authenticate('jwt', { session: false }),
  postController.post_delete
);

postsRouter.post('/:postId/like', 
  passport.authenticate('jwt', { session: false }), 
  postController.post_modify_likes
);

export default postsRouter;