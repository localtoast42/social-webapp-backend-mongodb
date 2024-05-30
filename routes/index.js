import express from 'express';
import usersRouter from './users.js';
import postsRouter from './posts.js';
import { login } from './auth.js';

const indexRouter = express.Router();

indexRouter.post('/login', login);

indexRouter.use('/users', usersRouter)
indexRouter.use('/posts', postsRouter)

export default indexRouter;
