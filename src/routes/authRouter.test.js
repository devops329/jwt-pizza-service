const app = require('../service.js');
const request = require('supertest');
const TH = require('../testHelpers.js');
const { Role } = require('../model/model');


describe("POST", () => {
  test("Create a new user", async () => {
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
})