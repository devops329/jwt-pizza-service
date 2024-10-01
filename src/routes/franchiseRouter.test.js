const request = require('supertest');
const app = require('../service');
const { createAdminUser, randomName } = require('./testHelpers.js');


describe('franchiseRouter testing...', () => {
  let adminUser;
  let adminUserAuthToken;

  beforeAll(async () => {
    adminUser = await createAdminUser();

    const loginRes = await request(app).put('/api/auth').send({
      email: adminUser.email,
      password: adminUser.password,
    });
    adminUserAuthToken = loginRes.body.token;
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
});

