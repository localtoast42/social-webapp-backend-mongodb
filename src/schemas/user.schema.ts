import { object, string, TypeOf } from 'zod';

export const createUserSchema = object({
  body: object({
    username: string({
      required_error: 'Username is required'
    }),
    password: string({
      required_error: 'Password is required'
    }).min(6, "Password must be at least 6 characters long"),
    passwordConfirmation: string({
      required_error: 'Password confirmation is required'
    }),
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>