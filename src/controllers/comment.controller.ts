import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { 
  CreateCommentInput, 
  ReadCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  LikeCommentInput,
  ReadCommentsByPostInput
} from '../schemas/comment.schema.js';
import { 
  createComment, 
  findComment,
  findAndUpdateComment, 
  deleteComment,
  findManyComments
} from '../services/comment.service.js';
import { findUser } from '../services/user.service.js';
import { 
  findAndUpdatePost, 
  findPost 
} from '../services/post.service.js';

export async function createCommentHandler(
  req: Request<CreateCommentInput["params"], {}, CreateCommentInput["body"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const postId = req.params.postId;

  if (!isValidObjectId(postId)) {
    return res.sendStatus(400);
  }

  const [user, post] = await Promise.all([
    findUser({ _id: userId }),
    findPost({ _id: postId }),
  ])

  if (!user) {
    return res.sendStatus(403);
  }

  if (!post) {
    return res.sendStatus(404);
  }

  const body = req.body;
  const postDate = new Date(Date.now());

  const comment = await createComment({ 
    ...body, 
    post: post._id, 
    author: user._id,
    postDate: postDate 
  });

  post.comments.push(comment._id);

  const update = {
    comments: post.comments,
  }

  await findAndUpdatePost({ _id: postId }, update, {});

  return res.status(201).json(comment);
}

export async function getCommentHandler(
  req: Request<ReadCommentInput["params"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const commentId = req.params.commentId;

  if (!isValidObjectId(commentId)) {
    return res.sendStatus(400);
  }

  const comment = await findComment({ _id: commentId });

  if (!comment) {
    return res.sendStatus(404);
  }

  comment.isLiked = comment.likes.includes(userId);

  return res.json(comment);
}

export async function getCommentsByPostHandler(
  req: Request<ReadCommentsByPostInput["params"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const postId = req.params.postId;

  if (!isValidObjectId(postId)) {
    return res.sendStatus(400);
  }

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  const query = {
    $or: [
      { author: userId },
      { isPublicComment: true },
    ],
  }

  const options = {
    sort: { "postDate": 1 }
  };

  const comments = await findManyComments(query, {}, options);

  return res.json(comments);
}

export async function updateCommentHandler(
  req: Request<UpdateCommentInput["params"], {}, UpdateCommentInput["body"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const commentId = req.params.commentId;

  if (!isValidObjectId(commentId)) {
    return res.sendStatus(400);
  }

  const [user, comment] = await Promise.all([
    findUser({ _id: userId }),
    findComment({ _id: commentId }),
  ])

  if (!comment) {
    return res.sendStatus(404);
  }

  if (!user || user.id !== comment.author.toString()) {
    return res.sendStatus(403);
  }

  const update = {
    ...req.body,
    lastEditDate: new Date(Date.now()),
  };

  const updatedComment = await findAndUpdateComment({ _id: commentId }, update, {
    new: true,
  });

  return res.json(updatedComment);
}

export async function deleteCommentHandler(
  req: Request<DeleteCommentInput["params"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
    return res.sendStatus(400);
  }

  const [user, post, comment] = await Promise.all([
    findUser({ _id: userId }),
    findPost({ _id: postId }),
    findComment({ _id: commentId }),
  ])

  if (!post || !comment) {
    return res.sendStatus(404);
  }

  if (!user || user.id !== comment.author.toString()) {
    return res.sendStatus(403);
  }

  post.comments.filter((commentid) => commentid != comment._id);

  const update = {
    comments: post.comments,
  }

  await findAndUpdatePost({ _id: postId }, update, {});

  await deleteComment({ _id: commentId });

  return res.sendStatus(200);
}

export async function likeCommentHandler(
  req: Request<LikeCommentInput["params"], {}, LikeCommentInput["body"]>, 
  res: Response
) {
  const like = JSON.parse(req.body.like);
  const userId = res.locals.user._id;
  const commentId = req.params.commentId;

  if (!isValidObjectId(commentId)) {
    return res.sendStatus(400);
  }

  const [user, comment] = await Promise.all([
    findUser({ _id: userId }),
    findComment({ _id: commentId }),
  ])

  if (!user) {
    return res.sendStatus(403);
  }

  if (!comment) {
    return res.sendStatus(404);
  }

  comment.likes = comment.likes.filter((userid) => userid != user.id);

  if (like) {
    comment.likes.push(user.id);
  }

  const update = {
    likes: comment.likes,
  }

  const updatedComment = await findAndUpdateComment({ _id: commentId }, update, {
    new: true,
  });

  return res.json(updatedComment);
}