import { Request, Response } from "express";
import { QueryOptions, UpdateQuery } from "mongoose";
import {
  CreatePostInput,
  ReadPostInput,
  UpdatePostInput,
  DeletePostInput,
  ReadPostByUserInput,
  LikePostInput,
} from "../schemas/post.schema";
import {
  createPost,
  findPost,
  findAndUpdatePost,
  deletePost,
  findManyPosts,
} from "../services/post.service";
import { deleteManyComments } from "../services/comment.service";
import { FindUserResult } from "../services/user.service";
import { Post } from "../models/post.model";

export async function createPostHandler(
  req: Request<{}, {}, CreatePostInput["body"]>,
  res: Response
) {
  const user: FindUserResult = res.locals.user;

  if (!user) {
    return res.sendStatus(403);
  }

  const body = req.body;
  const postDate = new Date(Date.now());

  const post = await createPost({
    ...body,
    author: user._id,
    postDate: postDate,
    isPublicPost: !user.isGuest,
  });

  return res.status(201).json(post);
}

export async function getPostHandler(
  req: Request<ReadPostInput["params"]>,
  res: Response
) {
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  return res.json(post);
}

export async function getRecentPostsHandler(req: Request, res: Response) {
  const user: FindUserResult = res.locals.user;
  const userId = user._id;

  const query = {
    $or: [{ author: userId }, { isPublicPost: true }],
  };

  const options: QueryOptions = {
    sort: { postDate: -1 },
  };

  if (req.query.limit) {
    options.limit = parseInt(req.query.limit as string);
  }

  if (req.query.skip) {
    options.skip = parseInt(req.query.skip as string);
  }

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json({ data: posts });
}

export async function getFollowedPostsHandler(req: Request, res: Response) {
  const user: FindUserResult = res.locals.user;
  const userId = user._id;
  const following = user.following;

  const query = {
    author: { $in: [...following, userId] },
    isPublicPost: true,
  };

  const options: QueryOptions = {
    sort: { postDate: -1 },
  };

  if (req.query.limit) {
    options.limit = parseInt(req.query.limit as string);
  }

  if (req.query.skip) {
    options.skip = parseInt(req.query.skip as string);
  }

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json({ data: posts });
}

export async function getPostsByUserHandler(
  req: Request<ReadPostByUserInput["params"]>,
  res: Response
) {
  const requestingUser: FindUserResult = res.locals.user;
  const requestingUserId = requestingUser._id;
  const targetUserId = req.params.userId;

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

  const options: QueryOptions = {
    sort: { postDate: -1 },
  };

  const posts = await findManyPosts(query, {}, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json({ data: posts });
}

export async function updatePostHandler(
  req: Request<UpdatePostInput["params"], {}, UpdatePostInput["body"]>,
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  if (user.id !== post.author.id) {
    return res.sendStatus(403);
  }

  const update: UpdateQuery<Post> = {
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
  const user: FindUserResult = res.locals.user;
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  post.likes = post.likes.filter((userid) => userid != user.id);

  if (like) {
    post.likes.push(user.id);
  }

  const update = {
    likes: post.likes,
  };

  const updatedPost = await findAndUpdatePost({ _id: postId }, update, {
    new: true,
  });

  return res.json(updatedPost);
}

export async function deletePostHandler(
  req: Request<DeletePostInput["params"]>,
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const postId = req.params.postId;

  const post = await findPost({ _id: postId });

  if (!post) {
    return res.sendStatus(404);
  }

  if (user.id !== post.author.id) {
    return res.sendStatus(403);
  }

  const commentResult = await deleteManyComments({ post: postId });

  const postResult = await deletePost({ _id: postId });

  return res.json({
    posts_deleted: postResult.deletedCount,
    comments_deleted: commentResult.deletedCount,
  });
}
