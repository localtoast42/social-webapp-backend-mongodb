import express from 'express';
import usersRouter from './users.js';
import postsRouter from './posts.js';
import { guest_create } from '../controllers/userController.js';
import { login } from './auth.js';

const indexRouter = express.Router();

indexRouter.post('/login', login);
indexRouter.post('/login/guest', guest_create, login);

indexRouter.use('/users', usersRouter)
indexRouter.use('/posts', postsRouter)

export default indexRouter;
