import express from 'express';
import passport from 'passport';
import userController from '../controllers/userController';

const usersRouter = express.Router({ mergeParams: true });

usersRouter.post('/', userController.user_create);

usersRouter.put('/:userId', userController.user_update);

usersRouter.delete('/:userId', userController.user_delete);

export default usersRouter;
