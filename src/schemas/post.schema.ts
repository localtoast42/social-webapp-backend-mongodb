import { object, string, TypeOf } from 'zod';

const payload = {
  body: object({
    text: string({
      required_error: 'Post must not be empty',
    }),
  }),
};

const params = {
  params: object({
    postId: string({
      required_error: 'postId is required',
    }),
  }),
};

export const createPostSchema = object({
  ...payload,
});

export const getPostSchema = object({
  ...params,
});

export const updatePostSchema = object({
  ...payload,
  ...params,
});

export const deletePostSchema = object({
  ...params,
});

export type CreatePostInput = TypeOf<typeof createPostSchema>
export type ReadPostInput = TypeOf<typeof getPostSchema>
export type UpdatePostInput = TypeOf<typeof updatePostSchema>
export type DeletePostInput = TypeOf<typeof deletePostSchema>