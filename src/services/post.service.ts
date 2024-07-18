import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import PostModel, { Post, PostCreate } from "../models/post.model.js";
import { User } from "../models/user.model.js";

export async function createPost(input: PostCreate) {
  try {
    const post = await PostModel.create(input);
    return post.toJSON();
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findPost(query: FilterQuery<Post>) {
  const result = PostModel.findOne(query).
    populate<{ author: User }>("author").
    lean({ virtuals: true });
  return result;
}

export async function findPostsByUser(query: FilterQuery<Post>) {
  return PostModel.findOne(query).lean();
}

export async function findAndUpdatePost(
  query: FilterQuery<Post>, 
  update: UpdateQuery<Post>,
  options: QueryOptions
) {
  return PostModel.findOneAndUpdate(query, update, options);
}

export async function deletePost(query: FilterQuery<Post>) {
  return PostModel.deleteOne(query);
}