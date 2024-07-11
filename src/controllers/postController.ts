import { IUser } from '../models/user.js';
import Post from '../models/post.js';
import Comment, { IComment } from '../models/comment.js';
import { Types } from 'mongoose';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

function isPostAuthor(req: Request, res: Response, next: NextFunction) {
  Post.findOne({ _id: req.params.postId })
    .populate<{ author: IUser }>("author")
    .then((post) => {
      if (post.author.id === req.user.id) {
        next();
      } else {
        res.status(401).json({ success: false, msg: "Unauthorized" });
      }
    })
    .catch((err) => next(err));
};

export const get_posts = asyncHandler(async (req, res, next) => {
  const post_limit = parseInt(req.query.limit as string);

  Post.find()
    .or([{ author: req.user.id }, { isPublicPost: true }])
    .sort("-postDate")
    .populate<{ author: IUser }>("author")
    .limit(post_limit)
    .exec()
    .then((posts) => {
      const postsData = posts.map(post => {
        return {
          id: post.id,
          url: post.url,
          text: post.text,
          dateTime: post.postDate,
          date: post.postDateFormatted,
          lastEditDate: post.lastEditDateFormatted,
          author: {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            imageUrl: post.author.imageUrl,
            url: post.author.url
          },
          numLikes: post.likes.length,
          isLiked: post.likes.includes(req.user.id),
          numComments: post.comments.length
        }
      })

      res.status(200).json(postsData);
    })
    .catch((err) => next(err));
});

export const get_followed_posts = asyncHandler(async (req, res, next) => {
  Post.find()
    .where("author").in([req.user.id, ...req.user.following])
    .sort("-postDate")
    .populate<{ author: IUser }>("author")
    .exec()
    .then((followedPosts) => {
      const followedPostsData = followedPosts.map(post => {
        return {
          id: post.id,
          url: post.url,
          text: post.text,
          dateTime: post.postDate,
          date: post.postDateFormatted,
          lastEditDate: post.lastEditDateFormatted,
          author: {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            imageUrl: post.author.imageUrl,
            url: post.author.url
          },
          numLikes: post.likes.length,
          isLiked: post.likes.includes(req.user.id),
          numComments: post.comments.length
        }
      });

      res.status(200).json(followedPostsData);
    })
    .catch((err) => next(err));
});

export const post_get = asyncHandler(async (req, res, next) => {
  Post.findById(req.params.postId)
    .populate<{ author: IUser }>("author")
    .populate<{ comments: IComment[] }>({
      path: "comments",
      match: { $or: [{ author: req.user.id }, { isPublicComment: true }] },
      options: { sort: { postDate: 1 }},
      populate: { path: "author" }
    })
    .exec()
    .then((post) => {
      const comments = post.comments.map(comment => {
        if (comment.author == null || comment.author instanceof Types.ObjectId) {
          throw new Error('should be populated');
        } else {
          return {
            id: comment.id,
            post: comment.post,
            text: comment.text,
            date: comment.postDateFormatted,
            author: {
              id: comment.author.id,
              username: comment.author.username,
              fullName: comment.author.fullName,
              imageUrl: comment.author.imageUrl,
              url: comment.author.url
            },
            numLikes: comment.likes.length,
            isLiked: comment.likes.includes(req.user.id),
          }
        }
      });

      const postData = {
        id: post.id,
        text: post.text,
        date: post.postDateFormatted,
        lastEditDate: post.lastEditDateFormatted,
        author: {
          id: post.author.id,
          username: post.author.username,
          fullName: post.author.fullName,
          imageUrl: post.author.imageUrl,
          url: post.author.url
        },
        comments: comments,
        numLikes: post.likes.length,
        isLiked: post.likes.includes(req.user.id),
        numComments: post.comments.length
      };

      res.status(200).json(postData);
    })
    .catch((err) => next(err));
});

export const post_create = [
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Post must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const post = new Post({
        author: req.user.id,
        text: req.body.text,
        postDate: Date.now(),
        isPublicPost: !req.user.isGuest,
      });
      
      post.save()
        .then((newPost) => {
          res.status(201).json(newPost);
        })
        .catch((err) => next(err));
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

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      Post.findOne({ _id: req.params.postId })
        .then((post) => {
          post.text = req.body.text;
          post.lastEditDate = new Date(Date.now());
          Post.findByIdAndUpdate(post._id, post, {});
        })
        .then((updatedPost) => {
          res.status(200).json(updatedPost);
        })
        .catch((err) => next(err));
    };
  }),
];

export const post_delete = [
  isPostAuthor,

  asyncHandler(async (req, res, next) => {    
    Comment.deleteMany({ post: req.params.postId })
      .then((response) => {
        Post.findByIdAndDelete(req.params.postId);
      })
      .then((response) => {
        res.status(200).end();
      })
      .catch((err) => next(err));
  }),
]

export const post_modify_likes = asyncHandler(async (req, res, next) => {
  Post.findOne({ _id: req.params.postId })
    .then((post) => {
      if (req.body.like && !post.likes.includes(req.user.id)) {
        post.likes.push(req.user.id);
      } else {
        post.likes = post.likes.filter((userid) => userid != req.user.id);
      }

      post.save();
    })
    .then((updatedPost) => {
      res.status(200).end();
    })
    .catch((err) => next(err));
});