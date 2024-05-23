import express from 'express';
import passport from 'passport';
import commentController from '../controllers/commentController';

const commentsRouter = express.Router();

commentsRouter.post('/', commentController.comment_create);

commentsRouter.put('/:commentId', commentController.comment_update);

commentsRouter.delete('/:commentId', commentController.comment_delete);

export default commentsRouter;