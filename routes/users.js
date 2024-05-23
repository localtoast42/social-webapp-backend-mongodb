import express from 'express';
import passport from 'passport';
import userController from '../controllers/userController';
import { isAuth } from './auth';

const usersRouter = express.Router({ mergeParams: true });

usersRouter.post('/', userController.user_create);

usersRouter.put('/:userId', 
  isAuth,
  userController.user_update
);

usersRouter.delete('/:userId', 
  isAuth,
  userController.user_delete
);

export default usersRouter;
