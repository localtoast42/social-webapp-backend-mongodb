import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { omit } from "lodash";
import UserModel, { User, UserInput } from "../models/user.model.js";

export async function createUser(input: UserInput) {
  try {
    return await UserModel.create(input);
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function validatePassword({
  username, password
}: {
  username: string, 
  password: string
}) {
  const user = await UserModel.findOne({username});

  if (!user) {
    return false;
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) return false;

  return omit(user.toJSON(), "password");
}

export async function findUser(query: FilterQuery<User>) {
  return UserModel.findOne(query).lean();
}

export async function findAndUpdateUser(
  query: FilterQuery<User>, 
  update: UpdateQuery<User>,
  options: QueryOptions
) {
  return UserModel.findOneAndUpdate(query, update, options);
}

export async function deleteUser(query: FilterQuery<User>) {
  return UserModel.deleteOne(query);
}