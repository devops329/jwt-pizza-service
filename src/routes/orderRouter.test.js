const request = require('supertest');
const app = require('../service');
const { createAdminUser, randomName } = require('./testHelpers.js');
const { DB } = require('../database/database.js');

describe('franchiseRouter testing...', () => {

  let adminUser;
  let adminUserAuthToken;
  let franchiseId;

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

  test("Get menu items: success", async () => {
    const res = await request(app)
      .get('/api/order/menu')
      .set('Authorization', `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('Add menu item: success', async () => {
    const newMenuItem = { title: randomName(), description: randomName(), image: 'pizza9.png', price: 0.0001 };
    const res = await request(app)
      .put('/api/order/menu')
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newMenuItem);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('create order: success', async () => {
    const newOrder = { franchiseId, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };
    const res = await request(app)
      .post('/api/order')
      .set('Authorization', `Bearer ${adminUserAuthToken}`)
      .send(newOrder);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('order');
    expect(res.body).toHaveProperty('jwt');
  });

  test('create order: unauthorized', async () => {
    const newOrder = { franchiseId, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };
    const res = await request(app)
      .post('/api/order')
      .send(newOrder);

    expect(res.status).toBe(401);
  });
});