import express from 'express';
import passport from 'passport';
import commentController from '../controllers/commentController';
import { isAuth } from './auth';

const commentsRouter = express.Router();

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

export default commentsRouter;