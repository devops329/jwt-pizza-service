const app = require('../service.js');
const request = require('supertest');
const TH = require('../testHelpers.js');
const { Role } = require('../model/model');

describe("GET", () => {
  let tempFranchise;
  let tempFranchisee;
  let token;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
    tempFranchisee = await TH.createTempUser([Role.Franchisee], tempFranchise.id);
    const loginResponse = await request(app).put('/api/auth/').send(tempFranchisee);
    token = loginResponse.body.token;
  });
  afterAll(async () => {
    await TH.deleteTempUser(tempFranchisee.name);
    await TH.deleteTempFranchise(tempFranchise.name);
  });
  test("Get all franchises", async () => {
    const response = await request(app).get('/api/franchise/');
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const matchingFranchise = body.find(f => f.id === tempFranchise.id);
    expect(matchingFranchise.name).toBe(tempFranchise.name);
  });
  test("Get a user's franchises", async () => {
    const response = await request(app).get(`/api/franchise/${tempFranchisee.id}`).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].name).toBe(tempFranchise.name);
  });
  test("Get a user's franchises", async () => {
    const response = await request(app).get(`/api/franchise/${tempFranchisee.id - 10}`).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
})

describe("POST", () => {
  let tempAdmin;
  let tempDiner;
  let tempFranchise;
  let tempFranchisee;
  let adminToken;
  let dinerToken;
  const newFranchiseInfo = {
    name: `new franchise ${TH.randomId()}`,
  }
  const newStoreInfo = {
    name: `new store ${TH.randomId()}`,
  }
  beforeAll(async () => {
    tempAdmin = await TH.createTempUser([Role.Admin]);
    tempDiner = await TH.createTempUser([Role.Diner]);
    tempFranchise = await TH.createTempFranchise();
    tempFranchisee = await TH.createTempUser([Role.Franchisee], tempFranchise.id);
    const loginResponse = await request(app).put('/api/auth/').send(tempAdmin);
    adminToken = loginResponse.body.token;
    const loginResponse2 = await request(app).put('/api/auth/').send(tempDiner);
    dinerToken = loginResponse2.body.token;
  });
  afterEach(async () => {
    await TH.deleteTempFranchise(newFranchiseInfo.name);
    await TH.deleteTempStore(newStoreInfo.name);
  })
  afterAll(async () => {
    await TH.deleteTempUser(tempAdmin.name);
    await TH.deleteTempUser(tempDiner.name);
    await TH.deleteTempUser(tempFranchisee.name);
    await TH.deleteTempFranchise(tempFranchise.name);

  });
  test("Create a new franchise (as admin)", async () => {
    newFranchiseInfo.admins = [{email: tempAdmin.email}];
    const response = await request(app).post('/api/franchise/').set('Authorization', `Bearer ${adminToken}`).send(newFranchiseInfo);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.name).toBe(newFranchiseInfo.name);
  });
  test("Create a new franchise (as diner)", async () => {
    newFranchiseInfo.admins = [{email: tempDiner.email}];
    const response = await request(app).post('/api/franchise/').set('Authorization', `Bearer ${dinerToken}`).send(newFranchiseInfo);
    expect(response.statusCode).toBe(403);
  });
  test("Create a new store (as admin)", async () => {
    const response = await request(app).post(`/api/franchise/${tempFranchise.id}/store`).set('Authorization', `Bearer ${adminToken}`).send(newStoreInfo);
    expect(response.statusCode).toBe(200);
  });
  test("Create a new store (as diner)", async () => {
    const response = await request(app).post(`/api/franchise/${tempFranchise.id}/store`).set('Authorization', `Bearer ${dinerToken}`).send(newStoreInfo);
    expect(response.statusCode).toBe(403);
  });
})

describe("DELETE", () => {
  let tempFranchise;
  let tempAdmin;
  let tempFranchise2; // has a store
  let tempStore;
  let adminToken;
  let dinerToken;
  let tempDiner;
  let tempFranchisee;
  beforeAll(async () => {
    tempAdmin = await TH.createTempUser([Role.Admin]);
    tempDiner = await TH.createTempUser([Role.Diner]);
    tempFranchise = await TH.createTempFranchise();
    tempFranchise2 = await TH.createTempFranchise();
    tempFranchisee = await TH.createTempUser([Role.Franchisee], tempFranchise2.id);
    tempStore = await TH.createTempStore(tempFranchise2.id);
    const loginResponse = await request(app).put('/api/auth/').send(tempAdmin);
    adminToken = loginResponse.body.token;
    const loginResponse2 = await request(app).put('/api/auth/').send(tempDiner);
    dinerToken = loginResponse2.body.token;
  });
  afterAll(async () => {
    await TH.deleteTempUser(tempFranchisee.name);
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise2.name);
    await TH.deleteTempUser(tempAdmin.name);
  });
  test("Delete a franchise (as admin)", async () => {
    const response = await request(app).delete(`/api/franchise/${tempFranchise.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.message).toBe('franchise deleted');
  });
  test("Delete a franchise (as diner)", async () => {
    const response = await request(app).delete(`/api/franchise/${tempFranchise.id}`).set('Authorization', `Bearer ${dinerToken}`);
    expect(response.statusCode).toBe(403);
  });
  test("Delete a store (as admin)", async () => {
    const response = await request(app).delete(`/api/franchise/${tempFranchise2.id}/store/${tempStore.id}`).set('Authorization', `Bearer ${adminToken}`);
    const body = response.body;
    expect(body.message).toBe('store deleted');
    expect(response.statusCode).toBe(200);
  });
  test("Delete a store (as diner)", async () => {
    const response = await request(app).delete(`/api/franchise/${tempFranchise2.id}/store/${tempStore.id}`).set('Authorization', `Bearer ${dinerToken}`);
    const body = response.body;
    expect(body.message).toBe('unable to delete a store');
    expect(response.statusCode).toBe(403);
  });
})