import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { 
  CreatePostInput, 
  ReadPostInput,
  UpdatePostInput, 
  DeletePostInput, 
  ReadPostByUserInput,
  LikePostInput,
} from '../schemas/post.schema.js';
import { 
  createPost, 
  findPost,
  findAndUpdatePost,
  deletePost,
  findManyPosts
} from '../services/post.service.js';
import { findUser } from '../services/user.service.js';
import { deleteManyComments } from '../services/comment.service.js';

export async function createPostHandler(
  req: Request<{}, {}, CreatePostInput["body"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(403);
  }

  const body = req.body;
  const postDate = new Date(Date.now());

  const post = await createPost({ 
    ...body, 
    author: user._id, 
    postDate: postDate,
    isPublicPost: !user.isGuest
  });

  return res.status(201).send(post);
}

export async function getPostHandler(
  req: Request<ReadPostInput["params"]>, 
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

  post.isLiked = post.likes.includes(userId);

  return res.send(post);
}

export async function getRecentPostsHandler(
  req: Request, 
  res: Response
) {
  const userId = res.locals.user._id;

  const query = {
    $or: [
      { author: userId },
      { isPublicPost: true },
    ],
  }
  
  const postLimit = parseInt(req.query.limit as string);

  const options = {
    sort: { "postDate": -1 },
    limit: postLimit
  }

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json(posts);
}

export async function getFollowedPostsHandler(
  req: Request, 
  res: Response
) {
  const userId = res.locals.user._id;
  const following = res.locals.user.following;

  const query = {
    'author': { $in: [...following, userId] },
    isPublicPost: true,
  }

  const options = {
    sort: { "postDate": -1 }
  }

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json(posts);
}

export async function getPostsByUserHandler(
  req: Request<ReadPostByUserInput["params"]>, 
  res: Response
) {
  const requestingUserId = res.locals.user._id;
  const targetUserId = req.params.userId;

  if (!isValidObjectId(targetUserId)) {
    return res.sendStatus(400);
  }

  let query = {};

  if (targetUserId === requestingUserId.toString()) {
    query = {
      author: targetUserId,
    };
  } else {
    query = {
      author: targetUserId,
      isPublicPost: true,
    };
  }

  const options = {
    sort: { "postDate": -1 }
  };

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json(posts);
}

export async function updatePostHandler(
  req: Request<UpdatePostInput["params"], {}, UpdatePostInput["body"]>, 
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

  if (!post) {
    return res.sendStatus(404);
  }

  if (!user || user.id !== post.author.toString()) {
    return res.sendStatus(403);
  }

  const update = {
    ...req.body,
    lastEditDate: new Date(Date.now()),
  };

  const updatedPost = await findAndUpdatePost({ _id: postId }, update, {
    new: true,
  });

  return res.json(updatedPost);
}

export async function likePostHandler(
  req: Request<LikePostInput["params"], {}, LikePostInput["body"]>, 
  res: Response
) {
  const like = JSON.parse(req.body.like);
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

  post.likes = post.likes.filter((userid) => userid != user.id);

  if (like) {
    post.likes.push(user.id);
  }

  const update = {
    likes: post.likes,
  }

  const updatedPost = await findAndUpdatePost({ _id: postId }, update, {
    new: true,
  });

  return res.json(updatedPost);
}

export async function deletePostHandler(
  req: Request<DeletePostInput["params"]>, 
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

  if (!post) {
    return res.sendStatus(404);
  }

  if (!user || user.id !== post.author.toString()) {
    return res.sendStatus(403);
  }

  const commentResult = await deleteManyComments({ post: postId })

  const postResult = await deletePost({ _id: postId });

  return res.sendStatus(200).json({
    posts_deleted: postResult.deletedCount,
    comments_deleted: commentResult.deletedCount,
  });
}