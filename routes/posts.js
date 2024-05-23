import express from 'express';
import passport from 'passport';
import commentsRouter from './comments';
import postController from '../controllers/postController';

const postsRouter = express.Router();

postsRouter.use('/:postId/comments', commentsRouter);

postsRouter.post('/', postController.post_create);

postsRouter.get('/:postId', postController.post_get);

postsRouter.put('/:postId', postController.post_update);

postsRouter.delete('/:postId', postController.post_delete);

export default postsRouter;