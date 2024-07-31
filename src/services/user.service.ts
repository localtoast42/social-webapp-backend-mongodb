import { FilterQuery, ProjectionType, QueryOptions, UpdateQuery } from "mongoose";
import { omit } from 'lodash';
import UserModel, { User, UserCreate } from "../models/user.model";

export async function createUser(input: UserCreate) {
  try {
    const user = await UserModel.create(input);
    return omit(user.toJSON(), "password");
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

export async function findUser(
  query: FilterQuery<User>,
  projection?: ProjectionType<User>
) {
  try {
    const result = await UserModel.findOne(query, projection).
      lean({ virtuals: true });
    return result;
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findManyUsers(
  query: FilterQuery<User>,
  projection?: ProjectionType<User>,
  options?: QueryOptions
) {
  const publicFields = {
    username: 1,
    firstName: 1,
    lastName: 1,
    city: 1,
    state: 1,
    country: 1,
    imageUrl: 1,
    fullName: 1,
    url: 1,
  }

  return UserModel.find(query, projection, options).select(publicFields);
}

export async function findAndUpdateUser(
  query: FilterQuery<User>, 
  update: UpdateQuery<User>,
  options: QueryOptions
) {
  try {
    const result = await UserModel.findOneAndUpdate(query, update, options);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function deleteUser(query: FilterQuery<User>) {
  return UserModel.deleteOne(query);
}