const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

// Admins cannot be registered through the API
async function createAdminUser() {
  const name = randomName();
  const user = { name, email: name + '@admin.com', password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}

// Log in as a user and return the JWT
async function loginUser(user) {
  const res = await request(app).put('/api/auth').send({ email: user.email, password: user.password });
  expect(res.status).toBe(200);
  return res.body;
}

// Create a diner and return the user and JWT
async function createDiner() {
  const user = { name: randomName(), password: 'a' };
  user.email = user.name + '@diner.com';
  const res = await request(app).post('/api/auth').send(user);
  expect(res.status).toBe(200);
  return { user: res.body.user, token: res.body.token };
}

let adminToken;
let adminUser;

beforeAll(async () => {
  adminUser = await createAdminUser();
  adminToken = (await loginUser(adminUser)).token;
});

async function createFranchise(adminEmail) {
  const res = await request(app)
    .post('/api/franchise')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: randomName(), admins: [{ email: adminEmail }] });
  expect(res.status).toBe(200);
  return res.body;
}

test('list franchises without auth', async () => {
  const res = await request(app).get('/api/franchise');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.franchises)).toBe(true);
});

test('admin creates a franchise', async () => {
  const franchise = await createFranchise(adminUser.email);
  expect(franchise.id).toBeGreaterThan(0);
  expect(franchise.admins[0].email).toBe(adminUser.email);
});

test('diner cannot create a franchise', async () => {
  const diner = await createDiner();
  const res = await request(app)
    .post('/api/franchise')
    .set('Authorization', `Bearer ${diner.token}`)
    .send({ name: randomName(), admins: [{ email: diner.user.email }] });
  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to create a franchise');
});

test('creating a franchise without a token is unauthorized', async () => {
  const res = await request(app).post('/api/franchise').send({ name: randomName(), admins: [] });
  expect(res.status).toBe(401);
});

test('admin lists their own franchises', async () => {
  const franchise = await createFranchise(adminUser.email);
  const admin = await loginUser(adminUser);
  const res = await request(app).get(`/api/franchise/${admin.user.id}`).set('Authorization', `Bearer ${admin.token}`);
  expect(res.status).toBe(200);
  expect(res.body.some((f) => f.id === franchise.id)).toBe(true);
});

test('a diner listing another user franchises gets nothing', async () => {
  const diner = await createDiner();
  const res = await request(app).get('/api/franchise/999999').set('Authorization', `Bearer ${diner.token}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('admin creates and deletes a store', async () => {
  const franchise = await createFranchise(adminUser.email);

  const createRes = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ franchiseId: franchise.id, name: 'SLC' });
  expect(createRes.status).toBe(200);
  expect(createRes.body.name).toBe('SLC');

  const deleteRes = await request(app)
    .delete(`/api/franchise/${franchise.id}/store/${createRes.body.id}`)
    .set('Authorization', `Bearer ${adminToken}`);
  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe('store deleted');
});

test('diner cannot create a store', async () => {
  const franchise = await createFranchise(adminUser.email);
  const diner = await createDiner();
  const res = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set('Authorization', `Bearer ${diner.token}`)
    .send({ franchiseId: franchise.id, name: 'SLC' });
  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to create a store');
});

test('diner cannot delete a store', async () => {
  const franchise = await createFranchise(adminUser.email);
  const store = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ franchiseId: franchise.id, name: 'SLC' });
  expect(store.status).toBe(200);

  const diner = await createDiner();
  const res = await request(app)
    .delete(`/api/franchise/${franchise.id}/store/${store.body.id}`)
    .set('Authorization', `Bearer ${diner.token}`);
  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to delete a store');
});

// Admin deletes a franchise
test('admin deletes a franchise', async () => {
  const franchise = await createFranchise(adminUser.email);
  const res = await request(app).delete(`/api/franchise/${franchise.id}`).set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
  expect(res.body.message).toBe('franchise deleted');
});

// Deleting a franchise requires a token
test('deleting a franchise without a token is unauthorized', async () => {
  const franchise = await createFranchise(adminUser.email);
  const res = await request(app).delete(`/api/franchise/${franchise.id}`);
  expect(res.status).toBe(401);
});
