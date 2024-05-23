import express from 'express';
import passport from 'passport';
import commentController from '../controllers/commentController';
import { isAuth } from './auth';

const commentsRouter = express.Router({ mergeParams: true });

commentsRouter.post('/', 
  isAuth,
  commentController.comment_create
);

commentsRouter.put('/:commentId', 
  isAuth,
  commentController.comment_update
);

commentsRouter.delete('/:commentId', 
  isAuth,
  commentController.comment_delete
);

commentsRouter.post('/:postId/likes', 
  isAuth, 
  commentController.comment_modify_likes
);

export default commentsRouter;