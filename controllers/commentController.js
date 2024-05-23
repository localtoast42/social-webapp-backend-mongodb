import Comment from '../models/comment';
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

exports.comment_create = [
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Comment must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const comment = new Comment({
      author: req.user.id,
      text: req.body.text,
      post: req.params.postId,
      postDate: Date.now(),
    });

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const newComment = await comment.save();
      res.status(201).json(newComment);
    };
  }),
];

exports.comment_update = [
  isCommentAuthor,

  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Comment must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const comment = await Comment.findOne({ _id: req.params.commentId });

    comment.text = req.body.text;
    comment.lastEditDate = Date.now();

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const updatedComment = await Comment.findByIdAndUpdate(comment._id, comment, {});
      res.status(200).end();
    }
  }),
];

exports.comment_delete = [
  isCommentAuthor,

  asyncHandler(async (req, res, next) => {   
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).end();
  }),
];

exports.comment_modify_likes = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findOne({ _id: req.params.commentId });

  if (comment.likes.includes(req.user.id)) {
    comment.likes = comment.likes.filter((userid) => userid != req.user.id);
  } else {
    comment.likes.push(req.user.id);
  }

  const updatedComment = await comment.save();
  res.status(200).json(updatedComment);
});