const request = require('supertest');
const app = require('../service');
const { DB } = require('../database/database.js');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

describe('authRouter testing...', () => {
  let testUserId;
  let testUserAuthToken;

  beforeAll(async () => {
    testUser.email = `${Math.random().toString(36).substring(2, 12)}@test.com`;
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;
  });

  afterEach(async () => {
    await DB.deleteUser(testUserId);
  });


  test('login', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(loginRes.body.user).toMatchObject(user);
    expect(password).toBe(testUser.password);
  });

  test('register', async () => {
    const registerRes = await request(app).post('/api/auth').send(testUser);
    expect(registerRes.status).toBe(200);
    expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(registerRes.body.user).toMatchObject(user);
    expect(password).toBe(testUser.password);

    await DB.deleteUser(registerRes.body.user.id)
  });

  test('logout', async () => {
    const logoutRes = await request(app).delete('/api/auth').set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
  });
});