import { Request, Response } from 'express';
import { omit } from 'lodash-es';
import logger from '../utils/logger.js';
import { 
  createUser, 
  findUser, 
  findUsersByName, 
  findAndUpdateUser, 
  deleteUser 
} from '../services/user.service.js';
import { CreateUserInput } from '../schemas/user.schema.js';
import { createRandomPost, createRandomUser } from '../utils/populateDatabase.js';

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput["body"]>, 
  res: Response
) {
  try {
    const user = await createUser(req.body);
    return res.send(user);
  } catch (e: any) {
    logger.error(e);
    return res.status(409).send(e.message);
  }
}

export async function getUserHandler(
  req: Request, 
  res: Response
) {
  const userId = req.params.userId;
  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  user.followedByMe = res.locals.user.following.includes(user._id);

  return res.send(omit(user, "password"));
}

export async function getSelfHandler(
  req: Request, 
  res: Response
) {
  const userId = res.locals.user._id;
  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  return res.send(omit(user, "password"));
}

export async function getUserListHandler(
  req: Request, 
  res: Response
) {
  const userId = res.locals.user._id;

  const queryTerms: object[] = [];
  queryTerms.push({ _id: { $exists: true} });

  if (req.query.q) {
    const queryString = req.query.q as string;
    let regex = new RegExp(queryString,'i');
    queryTerms.push({ $or: [{ firstName: regex }, { lastName: regex }]});
  } 

  const query = { 
    _id: { $ne: userId }, 
    isGuest: false,
    $and: queryTerms,
  }

  const options = {
    sort: { "lastName": 1 },
  }

  const users = await findUsersByName(query, options);

  return res.send(users);
}

export async function updateUserHandler(
  req: Request, 
  res: Response
) {
  const requestingUserId = res.locals.user._id;
  const userId = req.params.userId;
  const update = req.body;

  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  if (user._id !== requestingUserId) {
    return res.sendStatus(403);
  }

  const updatedUser = await findAndUpdateUser({ _id: userId }, update, { 
    new: true, 
  });

  return res.send(updatedUser);
}

export async function deleteUserHandler(
  req: Request, 
  res: Response
) {
  const requestingUserId = res.locals.user._id;
  const userId = req.params.userId;

  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  if (user._id !== requestingUserId) {
    return res.sendStatus(403);
  }

  await deleteUser({ _id: userId });

  return res.sendStatus(200);
}

export async function getUserFollowsHandler(
  req: Request, 
  res: Response
) {
  const userId = req.params.userId;
  const userFollows = await findUser({ _id: userId }, "following" );

  return res.send(userFollows);
}

export async function followUserHandler(
  req: Request, 
  res: Response
) {
  const requestingUserId = res.locals.user._id;
  const targetUserId = req.params.userId;

  const [requestingUser, targetUser] = await Promise.all([
    findUser({ _id: requestingUserId }),
    findUser({ _id: targetUserId })
  ])

  if (!targetUser || !requestingUser) {
    return res.sendStatus(404);
  }

  if (!requestingUser.following.includes(targetUser._id)) {
    requestingUser.following.push(targetUser._id);
  }

  if (!targetUser.followers.includes(requestingUser._id)) {
    targetUser.followers.push(requestingUser._id);
  }

  const requestingUserUpdates = {
    following: requestingUser.following,
  }

  const targetUserUpdates = {
    followers: targetUser.followers,
  }

  await Promise.all([
    findAndUpdateUser(
      { _id: requestingUserId }, 
      requestingUserUpdates, 
      { new: true }
    ),
    findAndUpdateUser(
      { _id: targetUserId }, 
      targetUserUpdates, 
      { new: true }
    )
  ])

  return res.sendStatus(200);
}

export async function unfollowUserHandler(
  req: Request, 
  res: Response
) {
  const requestingUserId = res.locals.user._id;
  const targetUserId = req.params.userId;

  const [requestingUser, targetUser] = await Promise.all([
    findUser({ _id: requestingUserId }),
    findUser({ _id: targetUserId })
  ])

  if (!targetUser || !requestingUser) {
    return res.sendStatus(404);
  }

  requestingUser.following = requestingUser.following.filter((userId) => {
    return userId.toString() !== targetUser._id.toString();
  });
  targetUser.followers = targetUser.followers.filter((userId) => {
    return userId.toString() !== requestingUser._id.toString();
  })

  const requestingUserUpdates = {
    following: requestingUser.following,
  }

  const targetUserUpdates = {
    followers: targetUser.followers,
  }

  await Promise.all([
    findAndUpdateUser(
      { _id: requestingUserId }, 
      requestingUserUpdates, 
      { new: true }
    ),
    findAndUpdateUser(
      { _id: targetUserId }, 
      targetUserUpdates, 
      { new: true }
    )
  ])

  return res.sendStatus(200);
}

export async function populateUsers(
  req: Request, 
  res: Response
) {
  const userCount = req.body.userCount;
  const postCount = req.body.postCount;

  for (let i = 0; i < userCount; i++) {
    let user = await createRandomUser();

    for (let j = 0; j < postCount; j++) {
      createRandomPost(user._id);
    }
  }

  res.sendStatus(201);
}