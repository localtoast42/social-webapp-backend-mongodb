import express from 'express';
import userController from '../controllers/userController';
import { isAuth } from './auth';

const usersRouter = express.Router();

usersRouter.post('/', userController.user_create);

usersRouter.put('/:userId', 
  isAuth,
  userController.user_update
);

usersRouter.delete('/:userId', 
  isAuth,
  userController.user_delete
);

usersRouter.get('/:userId/posts', 
  isAuth,
  userController.get_posts_by_user
);

usersRouter.post('/:userId/follow/:targetId', 
  isAuth,
  userController.user_follow
);

usersRouter.delete('/:userId/follow/:targetId', 
  isAuth,
  userController.user_unfollow
);

export default usersRouter;
