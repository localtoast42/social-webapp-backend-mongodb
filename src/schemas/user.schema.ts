import { object, string, TypeOf } from 'zod';

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
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>