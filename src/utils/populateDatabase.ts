import { Types } from 'mongoose';
import { fakerEN_US as faker } from '@faker-js/faker';
import { UserCreate } from '../models/user.model.js';
import { PostCreate } from '../models/post.model.js';
import { createUser } from '../services/user.service.js';
import { createPost } from '../services/post.service.js';

export async function createRandomUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const password = firstName.concat('', lastName);
  const username = faker.internet.userName({ firstName: firstName, lastName: lastName });

  const input: UserCreate = {
    username: username,
    password: password,
    firstName: firstName,
    lastName: lastName,
    city: faker.location.city(),
    state: faker.location.state(),
    country: 'United States',
    imageUrl: faker.image.avatarGitHub(),
  };

  try {
    const user = await createUser(input);
    return user;
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function createRandomPost(userId: Types.ObjectId) {
  const postDate = faker.date.between({ from: '2024-06-01T00:00:00.000Z', to: Date.now()})

  const input: PostCreate = {
    author: userId,
    text: faker.lorem.paragraph({ min: 1, max: 4 }),
    postDate: postDate,
    isPublicPost: true
  };

  try {
    const post = await createPost(input);
    return post;
  } catch (e: any) {
    throw new Error(e);
  }
}