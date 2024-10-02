const { DB, Role } = require('../database/database.js');
const request = require('supertest');
const app = require('../service');

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  user.password = 'toomanysecrets';

  const loginRes = await request(app).put('/api/auth').send(user);
  const token = loginRes.body.token;
  return {user, token};
}

module.exports = {
  randomName,
  createAdminUser
};
