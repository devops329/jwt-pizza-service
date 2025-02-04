const app = require('../service.js');
const request = require('supertest');
const TH = require('../testHelpers.js');
const { Role } = require('../model/model');


describe("POST", () => {
  test("Register a new user", async () => {
    const newUserInfo = {name: `pizza diner ${TH.randomId()}`, email: 'blah@gmail.com', password: 'diner'};
    const response = await request(app).post('/api/auth/').send(newUserInfo);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.user.name).toBe(newUserInfo.name);
    expect(body.user.email).toBe(newUserInfo.email);
    expect(body.user).toHaveProperty('roles');
    expect(body.user.roles).toHaveLength(1);
    expect(body.user.roles[0].role).toBe(Role.Diner);
    await TH.deleteTempUser(newUserInfo.name);
  })
  test("Register a new user without the required info", async () => {
    const newUserInfo = {};
    const response = await request(app).post('/api/auth/').send(newUserInfo);
    expect(response.statusCode).toBe(400);
  })
})
describe("PUT", () => {
  let tempUser;
  beforeEach(async () => {
    if (tempUser) {
      await TH.deleteTempUser(tempUser.name);
    }
    tempUser = await TH.createTempUser([Role.Diner]);
  })
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
  })
  test("Login existing user", async () => {
    const response = await request(app).put('/api/auth/').send(tempUser);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.user.name).toBe(tempUser.name);
    expect(body.user.email).toBe(tempUser.email);
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  })
  test("Login existing user with incorrect password", async () => {
    const response = await request(app).put('/api/auth/').send({email: tempUser.email, password: 'wrongpassword'});
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('unknown user');
  });
  test("Update user", async () => {
    const loginResponse = await request(app).put('/api/auth/').send(tempUser);
    const token = loginResponse.body.token;
    const newInfo = {
      email: `newEmail${TH.randomId()}@gmail.com`,
      password: `newpassword${TH.randomId()}`
    }
    const response = await request(app).put(`/api/auth/${tempUser.id}/`).set('Authorization', `Bearer ${token}`).send(newInfo);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.name).toBe(tempUser.name);
    expect(body.email).toBe(newInfo.email);
  })
  test("Update a different user", async () => {
    const loginResponse = await request(app).put('/api/auth/').send(tempUser);
    const token = loginResponse.body.token;
    const newInfo = {
      email: `newEmail${TH.randomId()}@gmail.com`,
      password: `newpassword${TH.randomId()}`
    }
    const response = await request(app).put(`/api/auth/${tempUser.id + 10}/`).set('Authorization', `Bearer ${token}`).send(newInfo);
    expect(response.statusCode).toBe(403);
    const body = response.body;
    expect(body.message).toBe('unauthorized');
  })
  test("Update user without auth", async () => {
    const newInfo = {
      email: `newEmail${TH.randomId()}@gmail.com`,
      password: `newpassword${TH.randomId()}`
    }
    const response = await request(app).put(`/api/auth/${tempUser.id}`).send(newInfo);
    expect(response.statusCode).toBe(401);
    const body = response.body;
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('unauthorized');
  })
  test("Update user with corrupted auth", async () => {
    const loginResponse = await request(app).put('/api/auth/').send(tempUser);
    const token = loginResponse.body.token;
    const newInfo = {
      email: `newEmail${TH.randomId()}@gmail.com`,
      password: `newpassword${TH.randomId()}`
    }
    const response = await request(app).put(`/api/auth/${tempUser.id}`).set('Authorization', `Bearer ${token.split('').reverse().join('')}`).send(newInfo);
    expect(response.statusCode).toBe(401);
    const body = response.body;
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('unauthorized');
  })
})

describe("DELETE", () => {
  let tempUser;
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
  })
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
  })
  test("Logout user", async () => {
    const loginResponse = await request(app).put('/api/auth/').send(tempUser);
    const token = loginResponse.body.token;
    const response = await request(app).delete('/api/auth/').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('logout successful');
  })
});