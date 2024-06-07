import express from 'express';
import passport from 'passport';
import * as commentController from '../controllers/commentController.js';

const commentsRouter = express.Router({ mergeParams: true });

commentsRouter.post('/', 
  passport.authenticate('jwt', { session: false }),
  commentController.comment_create
);

commentsRouter.put('/:commentId', 
  passport.authenticate('jwt', { session: false }), 
  commentController.comment_update
);

commentsRouter.delete('/:commentId', 
  passport.authenticate('jwt', { session: false }),
  commentController.comment_delete
);

commentsRouter.post('/:commentId/like', 
  passport.authenticate('jwt', { session: false }),
  commentController.comment_modify_likes
);

export default commentsRouter;