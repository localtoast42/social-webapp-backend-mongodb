import { isValidObjectId } from 'mongoose';
import { boolean, number, object, string, TypeOf } from 'zod';

const payload = {
  body: object({
    firstName: string({
      required_error: 'First name must be provided'
    }).min(1, { message: 'First name must not be empty' }),
    lastName: string({
      required_error: 'Last name must be provided'
    }).min(1, { message: 'Last name must not be empty' }),
    city: string(),
    state: string(),
    country: string(),
    imageUrl: string(),
  }),
}

const params = {
  params: object({
    userId: string({
      required_error: 'userId is required',
    }),
  }).refine((data) => isValidObjectId(data.userId), {
    message: "Invalid userId",
    path: ["userId"],
  })
}

export const createUserSchema = object({
  body: object({
    username: string({
      required_error: 'Username must be provided'
    }),
    password: string({
      required_error: 'Password must be provided'
    }).min(6, "Password must be at least 6 characters long"),
    passwordConfirmation: string({
      required_error: 'Password confirmation must be provided'
    }),
    firstName: string({
      required_error: 'First name must be provided'
    }),
    lastName: string({
      required_error: 'Last name must be provided'
    }),
    city: string(),
    state: string(),
    country: string(),
    imageUrl: string(),
    isGuest: boolean().optional(),
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export const getUserSchema = object({
  ...params,
});

export const followUserSchema = object({
  ...params,
});

export const unfollowUserSchema = object({
  ...params,
});

export const updateUserSchema = object({
  ...params,
  ...payload,
});

export const deleteUserSchema = object({
  ...params,
});

export const populateUsersSchema = object({
  body: object({
    userCount: number({
      required_error: 'User count must be provided'
    }),
    postCount: number({
      required_error: 'Post count must be provided'
    }),
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>
export type ReadUserInput = TypeOf<typeof getUserSchema>
export type FollowUserInput = TypeOf<typeof followUserSchema>
export type UnfollowUserInput = TypeOf<typeof unfollowUserSchema>
export type UpdateUserInput = TypeOf<typeof updateUserSchema>
export type DeleteUserInput = TypeOf<typeof deleteUserSchema>
export type PopulateUsersInput = TypeOf<typeof populateUsersSchema>