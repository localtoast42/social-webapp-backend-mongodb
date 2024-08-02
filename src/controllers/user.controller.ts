import { Request, Response } from 'express';
import config from 'config';
import { omit } from 'lodash';
import logger from '../utils/logger';
import { 
  createUser, 
  findUser, 
  findManyUsers, 
  findAndUpdateUser, 
  deleteUser,
  FindUserResult
} from '../services/user.service';
import { 
  CreateUserInput, 
  DeleteUserInput, 
  FollowUserInput, 
  PopulateUsersInput, 
  ReadUserInput, 
  UpdateUserInput 
} from '../schemas/user.schema';
import { 
  createRandomPost, 
  createRandomUser 
} from '../utils/populateDatabase';

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput["body"]>, 
  res: Response
) {
  req.body.isGuest = !config.get<boolean>('allowNewPublicUsers');

  try {
    const user = await createUser(req.body);
    logger.info(`User ${user.username} created`);
    return res.send(user);
  } catch (e: any) {
    logger.error(e);
    return res.status(409).json(e.message);
  }
}

export async function getUserHandler(
  req: Request<ReadUserInput["params"]>, 
  res: Response
) {
  const requestingUser: FindUserResult = res.locals.user;
  const requestingUserId = requestingUser.id;
  const userId = req.params.userId;

  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  const userObject = user.toJSON();

  userObject.followedByMe = userObject.followers.includes(requestingUserId);

  return res.json(userObject);
}

export async function getSelfHandler(
  req: Request, 
  res: Response
) {
  const user: FindUserResult = res.locals.user;

  return res.json(omit(user.toJSON(), "password"));
}

export async function getUserListHandler(
  req: Request, 
  res: Response
) {
  const user: FindUserResult = res.locals.user;
  const userId = user._id;

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

  const projection = {
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

  const options = {
    sort: { "lastName": 1 },
  }

  const users = await findManyUsers(query, projection, options);

  return res.json({ data: users });
}

export async function updateUserHandler(
  req: Request<UpdateUserInput["params"], {}, UpdateUserInput["body"]>, 
  res: Response
) {
  const requestingUser: FindUserResult = res.locals.user;
  const requestingUserId = requestingUser.id;
  const userId = req.params.userId;

  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  if (user.id !== requestingUserId) {
    return res.sendStatus(403);
  }

  const update = req.body;

  const updatedUser = await findAndUpdateUser({ _id: userId }, update, { 
    new: true, 
  });

  return res.json(updatedUser);
}

export async function deleteUserHandler(
  req: Request<DeleteUserInput["params"]>, 
  res: Response
) {
  const requestingUser: FindUserResult = res.locals.user;
  const requestingUserId = requestingUser.id;
  const userId = req.params.userId;

  const user = await findUser({ _id: userId });

  if (!user) {
    return res.sendStatus(404);
  }

  if (user.id !== requestingUserId) {
    return res.sendStatus(403);
  }

  const result = await deleteUser({ _id: userId });

  return res.json({
    ...result,
    accessToken: null,
    refreshToken: null
  });
}

export async function getUserFollowsHandler(
  req: Request<ReadUserInput["params"]>, 
  res: Response
) {
  const userId = req.params.userId;

  const userFollows = await findUser({ _id: userId }, "following" );

  if (userFollows === null) {
    return res.sendStatus(404);
  }

  return res.json(userFollows);
}

export async function followUserHandler(
  req: Request<FollowUserInput["params"], {}, FollowUserInput["body"]>, 
  res: Response
) {
  const follow = JSON.parse(req.body.follow);
  const requestingUser: FindUserResult = res.locals.user;
  const targetUserId = req.params.userId;

  const targetUser = await findUser({ _id: targetUserId });

  if (!targetUser) {
    return res.sendStatus(404);
  }

  requestingUser.following = requestingUser.following.filter((userId) => {
    return userId.toString() !== targetUser._id.toString();
  });
  targetUser.followers = targetUser.followers.filter((userId) => {
    return userId.toString() !== requestingUser._id.toString();
  });

  if (follow) {
    requestingUser.following.push(targetUser._id);
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
      { _id: requestingUser.id }, 
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
  req: Request<{}, {}, PopulateUsersInput["body"]>, 
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