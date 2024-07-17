import { User as IUser } from "./models/user.model.ts"

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}