import { fakerEN_US as faker } from '@faker-js/faker';
import User from './models/user.js';
import Post from './models/post.js';

export function createRandomUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const password = firstName.concat('', lastName);
  const username = faker.internet.userName({ firstName: firstName, lastName: lastName });

  const user = new User({
    username: username,
    password: password,
    imageUrl: faker.image.avatarGitHub(),
    firstName: firstName,
    lastName: lastName,
    city: faker.location.city(),
    state: faker.location.state(),
    country: 'United States',
    isAdmin: false,
  });
  
  return user;
}

export function createRandomPost(user) {
  const postDate = faker.date.between({ from: '2024-06-01T00:00:00.000Z', to: Date.now()})

  const post = new Post({
    author: user.id,
    text: faker.lorem.paragraph({ min: 1, max: 4 }),
    postDate: postDate
  });

  return post;
}