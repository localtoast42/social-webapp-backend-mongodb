import express from 'express';

const postsRouter = express.Router();

/* GET users listing. */
postsRouter.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

export default postsRouter;