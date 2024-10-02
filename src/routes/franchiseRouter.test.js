const request = require('supertest');
const app = require('../service');
const { createAdminUser, randomName } = require('./testHelpers.js');
const { DB } = require('../database/database.js');


describe('franchiseRouter testing...', () => {
  let adminUser;
  let adminUserAuthToken;
  let franchiseId;
  let linterError;

  beforeAll(async () => {
    const adminResponse = await createAdminUser();
    adminUser = adminResponse.user;
    adminUserAuthToken = adminResponse.token;
    
    const franchise = { name: randomName(), admins: [{ email: adminUser.email }] };
    const franchiseRes = await DB.createFranchise(franchise);
    franchiseId = franchiseRes.id;
  });

  afterAll(async () => {
    await DB.deleteFranchise(franchiseId);
    await DB.deleteUser(adminUser.id);
  });

  test("create a new franchise: successful response", async () => {
    const newFranchise = { name: randomName(), admins: [{ email: adminUser.email }] };
    const res = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newFranchise);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(newFranchise);
  });

  test("create a new franchise: unauthorized response", async () => {
    const newFranchise = { name: randomName(), admins: [{ email: adminUser.email }] };
    const res = await request(app)
      .post('/api/franchise')
      .send(newFranchise);

    expect(res.status).toBe(401);
  });

  test("get all franchises: successful response", async () => {
    const res = await request(app)
      .get('/api/franchise')
      .set('Authorization', `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('Create a store: successful response', async () => {
    const newStore = { franchiseId, name: randomName() };
    const res = await request(app)
      .post(`/api/franchise/${franchiseId}/store`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newStore);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(newStore);
  });

  test('Create a store: unauthorized response', async () => {
    const newStore = { franchiseId, name: randomName() };
    const res = await request(app)
      .post(`/api/franchise/${franchiseId}/store`)
      .send(newStore);

    expect(res.status).toBe(401);
  });

  test('Delete a store: successful response', async () => {
    const newStore = { franchiseId, name: randomName() };
    const storeRes = await request(app)
      .post(`/api/franchise/${franchiseId}/store`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newStore);

    const res = await request(app)
      .delete(`/api/franchise/${franchiseId}/store/${storeRes.body.id}`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'store deleted' });
  });

  test('Delete a store: unauthorized response', async () => {
    const newStore = { franchiseId, name: randomName() };
    const storeRes = await request(app)
      .post(`/api/franchise/${franchiseId}/store`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newStore);

    const res = await request(app)
      .delete(`/api/franchise/${franchiseId}/store/${storeRes.body.id}`);

    expect(res.status).toBe(401);
  });

  test('Delete a franchise: successful response', async () => {
    const newFranchise = { name: randomName(), admins: [{ email: adminUser.email }] };
    const franchiseRes = await DB.createFranchise(newFranchise);

    const res = await request(app)
      .delete(`/api/franchise/${franchiseRes.id}`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'franchise deleted' });
  });

  test('Get user franchises: successful response', async () => {
    const res = await request(app)
      .get(`/api/franchise/${adminUser.id}`)
      .set('Authorization', `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});