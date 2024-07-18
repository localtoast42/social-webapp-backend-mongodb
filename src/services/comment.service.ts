import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import CommentModel, { Comment, CommentCreate } from "../models/comment.model.js";

export async function createComment(input: CommentCreate) {
  try {
    return await CommentModel.create(input);
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findComment(query: FilterQuery<Comment>) {
  return CommentModel.findOne(query).lean();
}

export async function findAndUpdateComment(
  query: FilterQuery<Comment>, 
  update: UpdateQuery<Comment>,
  options: QueryOptions
) {
  return CommentModel.findOneAndUpdate(query, update, options);
}

export async function deleteComment(query: FilterQuery<Comment>) {
  return CommentModel.deleteOne(query);
}