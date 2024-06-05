import express from 'express';
import passport from 'passport';
import * as userController from '../controllers/userController.js';

const usersRouter = express.Router();

usersRouter.get('/',
  passport.authenticate('jwt', { session: false }), 
  userController.user_list_get
);

usersRouter.post('/', 
  userController.user_create
);

usersRouter.get('/self', 
  passport.authenticate('jwt', { session: false }),
  userController.user_self_get
);

usersRouter.get('/following', 
  passport.authenticate('jwt', { session: false }),
  userController.self_following_get
);

usersRouter.get('/:userId', 
  passport.authenticate('jwt', { session: false }), 
  userController.user_get
);

usersRouter.put('/:userId', 
  passport.authenticate('jwt', { session: false }), 
  userController.user_update
);

usersRouter.delete('/:userId', 
  passport.authenticate('jwt', { session: false }),
  userController.user_delete
);

usersRouter.get('/:userId/posts', 
  passport.authenticate('jwt', { session: false }),
  userController.get_posts_by_user
);

usersRouter.get('/:userId/following', 
  passport.authenticate('jwt', { session: false }),
  userController.user_following_get
);

usersRouter.post('/:userId/follow', 
  passport.authenticate('jwt', { session: false }),
  userController.user_follow
);

usersRouter.delete('/:userId/follow', 
  passport.authenticate('jwt', { session: false }),
  userController.user_unfollow
);

export default usersRouter;
