import { Request, Response } from 'express';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { 
  CreateCommentInput, 
  ReadCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  LikeCommentInput,
  ReadCommentsByPostInput
} from '../schemas/comment.schema';
import { 
  createComment, 
  findComment,
  findAndUpdateComment, 
  deleteComment,
  findManyComments
} from '../services/comment.service';
import { 
  findAndUpdatePost, 
  findPost 
} from '../services/post.service';
import { FindUserResult } from '../services/user.service';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';

export async function createCommentHandler(
  req: Request<CreateCommentInput["params"], {}, CreateCommentInput["body"]>, 
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  const body = req.body;
  const postDate = new Date(Date.now());

  const comment = await createComment({ 
    ...body, 
    post: post._id, 
    author: user._id,
    postDate: postDate,
    isPublicComment: !user.isGuest
  });

  post.comments.push(comment._id);

  const update: UpdateQuery<Post> = {
    comments: post.comments,
  }

  await findAndUpdatePost({ _id: postId }, update, {});

  return res.status(201).json(comment);
}

export async function getCommentHandler(
  req: Request<ReadCommentInput["params"]>, 
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const userId = user._id;
  const commentId = req.params.commentId;

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
  const user: FindUserResult = res.locals.user;
  const userId = user._id;
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  const query: FilterQuery<Comment> = {
    $or: [
      { author: userId },
      { isPublicComment: true },
    ],
  }

  const options: QueryOptions = {
    sort: { "postDate": 1 }
  };

  const comments = await findManyComments(query, {}, options);

  return res.json({ data: comments });
}

export async function updateCommentHandler(
  req: Request<UpdateCommentInput["params"], {}, UpdateCommentInput["body"]>, 
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const commentId = req.params.commentId;

  const comment = await findComment({ _id: commentId });

  if (!comment) {
    return res.sendStatus(404);
  }

  if (user.id !== comment.author.id) {
    return res.sendStatus(403);
  }

  const update: UpdateQuery<Comment> = {
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
  const user: FindUserResult = res.locals.user;
  const commentId = req.params.commentId;

  const comment = await findComment({ _id: commentId });

  if (!comment) {
    return res.sendStatus(404);
  }

  if (user.id !== comment.author.id) {
    return res.sendStatus(403);
  }

  const post = await findPost({ _id: comment.post });

  if (post) {
    post.comments = post.comments.filter((commentid) => commentid != comment.id);

    const update: UpdateQuery<Post> = {
      comments: post.comments,
    }

    await findAndUpdatePost({ _id: post.id }, update, { new: true });
  }

  const commentResult = await deleteComment({ _id: commentId });

  return res.json(commentResult);
}

export async function likeCommentHandler(
  req: Request<LikeCommentInput["params"], {}, LikeCommentInput["body"]>, 
  res: Response
) {
  const like = JSON.parse(req.body.like);
  const user: FindUserResult = res.locals.user;
  const commentId = req.params.commentId;

  const comment = await findComment({ _id: commentId });

  if (!comment) {
    return res.sendStatus(404);
  }

  comment.likes = comment.likes.filter((userid) => userid != user.id);

  if (like) {
    comment.likes.push(user.id);
  }

  const update: UpdateQuery<Comment> = {
    likes: comment.likes,
  }

  const updatedComment = await findAndUpdateComment({ _id: commentId }, update, {
    new: true,
  });

  return res.json(updatedComment);
}