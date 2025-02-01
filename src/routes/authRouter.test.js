const request = require('supertest');
const app = require('../service');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeEach(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id
  expectValidJwt(testUserAuthToken);
});

test('login test', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);
  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('logout test', async() =>{
  const authHeader = 'Bearer ' + testUserAuthToken
  const logoutRes = await request(app).delete('/api/auth').set('Authorization', authHeader);
  expect(logoutRes.status).toBe(200);
  const logoutRes2 = await request(app).delete('/api/auth').set('Authorization', authHeader);
  expect(logoutRes2.status).toBe(401);

});

test('update test', async() => {
  let testUser2 = { name: 'pizza diner', email: 'new@email.com', password: 'z' };
  let expected = {name: 'pizza diner', email: 'new@email.com'}
  const updateRes = await request(app).put('/api/auth/' + testUserId).set('Authorization','Bearer: ' + testUserAuthToken).send(testUser2)
  expect(updateRes.status).toBe(200);
  expect(updateRes.body).toMatchObject(expected);
})

test('bad update test', async() => {
  let testUser2 = { name: 'pizza diner', email: 'new@email.com', password: 'z' };
  testUserId += 1
  const updateRes = await request(app).put('/api/auth/' + testUserId).set('Authorization','Bearer: ' + testUserAuthToken).send(testUser2)
  expect(updateRes.status).toBe(403);
})

test('bad register test', async() => {
  testUser.name = ''
  const regRes = await request(app).post('/api/auth').send(testUser);
  expect(regRes.status).toBe(400)
})

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}