import Post from '../models/post.model.js';
import { IUser } from '../models/user.model.js';
import Comment from '../models/comment.model.js';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

function isCommentAuthor(req: Request, res: Response, next: NextFunction) {
  Comment.findOne({ _id: req.params.commentId })
    .populate<{ author: IUser }>("author")
    .then((comment) => {
      if (comment.author.id === req.user.id) {
        next();
      } else {
        res.status(401).json({ success: false, msg: "Unauthorized" });
      }
    })
    .catch((err) => next(err));
};

export const comment_create = [
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Comment must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      Post.findOne({ _id: req.params.postId })
        .then((post) => {
          const comment = new Comment({
            author: req.user.id,
            text: req.body.text,
            post: req.params.postId,
            postDate: Date.now(),
            isPublicComment: !req.user.isGuest,
          });

          const promise = comment.save()
            .then((newComment) => {
              post.comments.push(newComment.id);
              return Post.findByIdAndUpdate(post._id, post, {});
            });

          return promise;
        })
        .then((response) => {
          res.status(201).end();
        })
        .catch((err) => next(err));
    };
  }),
];

export const comment_update = [
  isCommentAuthor,

  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Comment must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      Comment.findOne({ _id: req.params.commentId })
        .then((comment) => {
          comment.text = req.body.text;
          comment.lastEditDate = new Date(Date.now());

          Comment.findByIdAndUpdate(comment._id, comment, {});
        })
        .then((response) => {
          res.status(200).end();
        })
        .catch((err) => next(err));
    }
  }),
];

export const comment_delete = [
  isCommentAuthor,

  asyncHandler(async (req, res, next) => {   
    Comment.findByIdAndDelete(req.params.commentId)
      .then((response) => {
        res.status(200).end();
      })
      .catch((err) => next(err));
  }),
];

export const comment_modify_likes = asyncHandler(async (req, res, next) => {
  Comment.findOne({ _id: req.params.commentId })
    .then((comment) => {
      if (req.body.like && !comment.likes.includes(req.user.id)) {
        comment.likes.push(req.user.id);
      } else {
        comment.likes = comment.likes.filter((userid) => userid != req.user.id);
      }

      comment.save();
    })
    .then((updatedComment) => {
      res.status(200).end();
    })
    .catch((err) => next(err));
});