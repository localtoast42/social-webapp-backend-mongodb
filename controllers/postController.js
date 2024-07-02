import Post from '../models/post.js';
import Comment from '../models/comment.js';
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
  Post.find()
    .or([{ author: req.user.id }, { publicPost: true }])
    .sort("-postDate")
    .populate("author")
    .limit(req.query.limit)
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

      return res.status(200).json(postsData);
    })
    .catch((err) => next(err));
});

export const get_followed_posts = asyncHandler(async (req, res, next) => {
  Post.find()
    .where("author").in([req.user.id, ...req.user.following])
    .sort("-postDate")
    .populate("author")
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

      return res.status(200).json(followedPostsData);
    })
    .catch((err) => next(err));
});

export const post_get = asyncHandler(async (req, res, next) => {
  Post.findById(req.params.postId)
    .populate("author")
    .populate({
      path: "comments",
      options: { sort: { postDate: 1 }},
      populate: { path: "author" }
    })
    .exec()
    .then((post) => {
      const comments = post.comments.map(comment => {
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

      return res.status(200).json(postData);
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
          return res.status(201).json(newPost);
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
          post.lastEditDate = Date.now();
          return Post.findByIdAndUpdate(post._id, post, {});
        })
        .then((updatedPost) => {
          return res.status(200).json(updatedPost);
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
        return Post.findByIdAndDelete(req.params.postId);
      })
      .then((response) => {
        return res.status(200).end();
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

      return post.save();
    })
    .then((updatedPost) => {
      return res.status(200).json(updatedPost);
    })
    .catch((err) => next(err));
});