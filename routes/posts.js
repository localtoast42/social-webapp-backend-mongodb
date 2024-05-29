import express from 'express';
import commentsRouter from './comments.js';
import postController from '../controllers/postController.js';
import { isAuth } from './auth.js';

const postsRouter = express.Router();

postsRouter.use('/:postId/comments', commentsRouter);

postsRouter.get('/', 
  isAuth, 
  postController.get_posts
);

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