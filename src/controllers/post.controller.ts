import { Request, Response } from 'express';
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
    postDate: postDate 
  });

  return res.status(201).send(post);
}

export async function getPostHandler(
  req: Request<ReadPostInput["params"]>, 
  res: Response
) {
  const userId = res.locals.user._id;
  const postId = req.params.postId;
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

  const posts = await findManyPosts(query, options);

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
    $and: [
      { author: { 
        $in: [...following, userId]
      }},
      { isPublicPost: true },
    ],
  }

  const options = {
    sort: { "postDate": -1 }
  }

  const posts = await findManyPosts(query, options);

  if (!posts) {
    return res.sendStatus(404);
  }

  return res.json(posts);
}

export async function getPostsByUserHandler(
  req: Request<ReadPostByUserInput["params"]>, 
  res: Response
) {
  const userId = req.params.userId;

  const query = {
    $and: [
      { author: userId },
      { isPublicPost: true },
    ],
  }

  const options = {
    sort: { "postDate": -1 }
  };

  const posts = await findManyPosts(query, options);

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

  const [user, post] = await Promise.all([
    findUser({ _id: userId }),
    findPost({ _id: postId }),
  ])

  if (!post) {
    return res.sendStatus(404);
  }

  if (!user || user._id !== post.author.id) {
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
  const like = req.body.like;
  const userId = res.locals.user._id;
  const postId = req.params.postId;

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

  if (like && !post.likes.includes(user._id)) {
    post.likes.push(user._id);
  } else {
    post.likes = post.likes.filter((userid) => userid != user._id);
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

  const [user, post] = await Promise.all([
    findUser({ _id: userId }),
    findPost({ _id: postId }),
  ])

  if (!post) {
    return res.sendStatus(404);
  }

  if (!user || user._id !== post.author.id) {
    return res.sendStatus(403);
  }

  await deletePost({ _id: postId });

  return res.sendStatus(200);
}