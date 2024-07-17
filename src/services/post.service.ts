import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import PostModel, { Post, PostInput } from "../models/post.model.js";

export async function createPost(input: PostInput) {
  try {
    return await PostModel.create(input);
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findPost(query: FilterQuery<Post>) {
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