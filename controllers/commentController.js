import Post from '../models/post.js';
import Comment from '../models/comment.js';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

function isCommentAuthor(req, res, next) {
  Comment.findOne({ _id: req.params.commentId })
    .then((comment) => {
      if (comment.author.toString() === req.user.id) {
        return next();
      } else {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
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
              post.comments.push(newComment._id);
              return Post.findByIdAndUpdate(post._id, post, {});
            });

          return promise;
        })
        .then((response) => {
          return res.status(201).end();
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
          comment.lastEditDate = Date.now();

          return Comment.findByIdAndUpdate(comment._id, comment, {});
        })
        .then((response) => {
          return res.status(200).end();
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
        return res.status(200).end();
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

      return comment.save();
    })
    .then((updatedComment) => {
      return res.status(200).json(updatedComment);
    })
    .catch((err) => next(err));
});