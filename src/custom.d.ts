import { IUser } from "./models/user.ts"

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}