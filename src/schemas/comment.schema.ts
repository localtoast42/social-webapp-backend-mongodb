import { isValidObjectId } from 'mongoose';
import { object, string, TypeOf } from 'zod';

const payload = {
  body: object({
    text: string({
      required_error: 'Comment must not be empty',
    }),
  }),
};

const like = object({
  like: string()
});

const params = object({
  postId: string({
    required_error: 'postId is required',
  }).refine((data) => isValidObjectId(data), {
    message: "Invalid postId",
  }),
  commentId: string({
    required_error: 'commentId is required',
  }).refine((data) => isValidObjectId(data), {
    message: "Invalid commentId",
  }),
})

export const createCommentSchema = object({
  ...payload,
  params: params.pick({ postId: true }),
});

export const getCommentSchema = object({
  params: params.pick({ commentId: true }),
});

export const getCommentsByPostSchema = object({
  params: params.pick({ postId: true }),
});

export const updateCommentSchema = object({
  ...payload,
  params: params.pick({ commentId: true }),
});

export const likeCommentSchema = object({
  body: like,
  params: params.pick({ commentId: true }),
});

export const deleteCommentSchema = object({
  params: params,
});

export type CreateCommentInput = TypeOf<typeof createCommentSchema>
export type ReadCommentInput = TypeOf<typeof getCommentSchema>
export type ReadCommentsByPostInput = TypeOf<typeof getCommentsByPostSchema>
export type UpdateCommentInput = TypeOf<typeof updateCommentSchema>
export type LikeCommentInput = TypeOf<typeof likeCommentSchema>
export type DeleteCommentInput = TypeOf<typeof deleteCommentSchema>