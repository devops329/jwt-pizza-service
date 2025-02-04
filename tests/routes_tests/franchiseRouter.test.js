const request = require('supertest');
const app = require('../../src/service');   
/*
beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app)
    .post('/api/franchise')
    .set()
    .send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserID = registerRes.body.user.id;
    expectValidJwt(testUserAuthToken);
  });
  */

//test list all franchises
test('list', async () => {
    const listRes = await request(app).get('/api/franchise')
    expect(listRes.status).toBe(200);
  });