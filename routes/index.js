import express from 'express';
import usersRouter from './users';
import postsRouter from './posts';
import userController from '../controllers/userController';

const indexRouter = express.Router();

indexRouter.post('/login', userController.user_login);
indexRouter.post('/logout', userController.user_logout);

indexRouter.use('/users', usersRouter)
indexRouter.use('/posts', postsRouter)

export default indexRouter;
