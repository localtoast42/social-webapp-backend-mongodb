import express from 'express';

const commentsRouter = express.Router();

/* GET users listing. */
commentsRouter.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

export default commentsRouter;