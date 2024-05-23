import express from 'express';
import passport from 'passport';
import commentsRouter from './comments';
import postController from '../controllers/postController';
import { isAuth } from './auth';

const postsRouter = express.Router();

postsRouter.use('/:postId/comments', commentsRouter);

postsRouter.post('/', 
  isAuth, 
  postController.post_create
);

postsRouter.get('/:postId', 
  isAuth, 
  postController.post_get
);

postsRouter.put('/:postId', 
  isAuth, 
  postController.post_update
);

postsRouter.delete('/:postId', 
  isAuth, 
  postController.post_delete
);

postsRouter.post('/:postId/likes', 
  isAuth, 
  postController.post_modify_likes
);

export default postsRouter;