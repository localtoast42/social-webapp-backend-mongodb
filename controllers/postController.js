import Post from '../models/post.js';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

function isPostAuthor(req, res, next) {
  Post.findOne({ _id: req.params.postId })
    .then((post) => {
      if (post.author.toString() === req.user.id) {
        return next();
      } else {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
      }
    })
    .catch((err) => next(err));
};

export const get_posts = asyncHandler(async (req, res, next) => {
  const followedPosts = await Post.find()
    .where("author").in(req.user.following)
    .sort("-postDate")
    .populate("author")
    .exec();

  const followedPostsData = followedPosts.map(post => {
    return {
      id: post.id,
      text: post.text,
      dateTime: post.postDate,
      date: post.postDateFormatted,
      lastEditDate: post.lastEditDateFormatted,
      author: {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        url: post.author.url
      },
      isLiked: post.likes.includes(req.user.id)
    }
  })

  res.status(200).json(followedPostsData);
});

export const post_get = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId)
    .populate("author")
    .exec();

  const postData = {
    id: post.id,
    text: post.text,
    date: post.postDateFormatted,
    lastEditDate: post.lastEditDateFormatted,
    author: post.author.fullName
  }

  res.status(200).json(postData);
});

export const post_create = [
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Post must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const post = new Post({
      author: req.user.id,
      text: req.body.text,
      postDate: Date.now()
    });

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const newPost = await post.save();
      res.status(201).json(newPost);
    };
  }),
];

export const post_update = [
  isPostAuthor,

  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Post must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const post = await Post.findOne({ _id: req.params.postId });

    post.text = req.body.text;
    post.lastEditDate = Date.now();

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const updatedPost = await Post.findByIdAndUpdate(post._id, post, {});
      res.status(200).json(updatedPost);
    };
  }),
];

export const post_delete = [
  isPostAuthor,

  asyncHandler(async (req, res, next) => {    
      await Comment.deleteMany({ post: req.params.postId });
      await Post.findByIdAndDelete(req.params.postId);
      res.status(200).end();
  }),
]

export const post_modify_likes = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({ _id: req.params.postId });

  if (post.likes.includes(req.user.id)) {
    post.likes = post.likes.filter((userid) => userid != req.user.id);
  } else {
    post.likes.push(req.user.id);
  }

  const updatedPost = await post.save();
  res.status(200).json(updatedPost);
});