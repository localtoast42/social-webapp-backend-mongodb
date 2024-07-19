import { object, string, TypeOf } from 'zod';

const payload = {
  body: object({
    text: string({
      required_error: 'Post must not be empty',
    }),
  }),
};

const like = object({
  like: string()
});

const params = object({
  postId: string({
    required_error: 'postId is required',
  }),
  userId: string({
    required_error: 'userId is required',
  }),
})

export const createPostSchema = object({
  ...payload,
});

export const getPostSchema = object({
  params: params.pick({ postId: true }),
});

export const getPostByUserSchema = object({
  params: params.pick({ userId: true }),
});

export const updatePostSchema = object({
  ...payload,
  params: params.pick({ postId: true }),
});

export const likePostSchema = object({
  body: like,
  params: params.pick({ postId: true }),
});

export const deletePostSchema = object({
  params: params.pick({ postId: true }),
});

export type CreatePostInput = TypeOf<typeof createPostSchema>
export type ReadPostInput = TypeOf<typeof getPostSchema>
export type ReadPostByUserInput = TypeOf<typeof getPostByUserSchema>
export type UpdatePostInput = TypeOf<typeof updatePostSchema>
export type LikePostInput = TypeOf<typeof likePostSchema>
export type DeletePostInput = TypeOf<typeof deletePostSchema>