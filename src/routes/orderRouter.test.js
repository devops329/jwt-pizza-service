const app = require('../service.js');
const request = require('supertest');
const TH = require('../testHelpers.js');
const { Role } = require('../model/model');

describe("GET", () => {
  let tempMenuItem;
  let tempUser;
  let tempFranchise;
  let tempStore;
  let tempOrder;
  let tempOrderItem;
  let token;
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
    tempMenuItem = await TH.createTempMenuItem();
    tempFranchise = await TH.createTempFranchise();
    tempStore = await TH.createTempStore(tempFranchise.id);
    tempOrder = await TH.createTempOrder(tempUser.id, tempFranchise.id, tempStore.id);
    tempOrderItem = await TH.addTempOrderItem(tempOrder.id, tempMenuItem.id);
    const response = await request(app).put('/api/auth/').send(tempUser);
    token = response.body.token;
  })
  afterAll(async () => {
    await TH.deleteTempOrder(tempOrder.id);
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempMenuItem(tempMenuItem.title);
    await TH.deleteTempUser(tempUser.name);
  })
  test("Get Menu", async () => {
    const response = await request(app).get('/api/order/menu');
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const matchingMenuItem = body.find(m => m.id === tempMenuItem.id);
    expect(matchingMenuItem.title).toBe(tempMenuItem.title);
  })
  test("Get Orders", async () => {
    const response = await request(app).get('/api/order').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.dinerId).toBe(tempUser.id);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.orders.length).toBeGreaterThan(0);
    const matchingOrder = body.orders.find(o => o.id === tempOrder.id);
    expect(matchingOrder.id).toBe(tempOrder.id);
  })
})

describe("PUT", () => {
  const newMenuItem = {
    title: `temp menu item ${TH.randomId()}`,
    description: 'new menu item',
    image: 'newMenuItem.png',
    price: 0.01
  }
  let tempDiner;
  let tempAdmin;
  let adminToken;
  let dinerToken;
  beforeAll(async () => {
    tempDiner = await TH.createTempUser([Role.Diner]);
    tempAdmin = await TH.createTempUser([Role.Admin]);
    const adminResponse = await request(app).put('/api/auth/').send(tempAdmin);
    adminToken = adminResponse.body.token;
    const dinerResponse = await request(app).put('/api/auth/').send(tempDiner);
    dinerToken = dinerResponse.body.token;
  });
  afterAll(async () => {
    await TH.deleteTempUser(tempDiner.name);
    await TH.deleteTempUser(tempAdmin.name);
    await TH.deleteTempMenuItem(newMenuItem.title);
  });
  test("Add Menu Item (as admin)", async () => {
    const response = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminToken}`).send(newMenuItem);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(Array.isArray(body)).toBe(true);
    const matchingMenuItem = body.find(m => m.title === newMenuItem.title);
    expect(matchingMenuItem.title).toBe(newMenuItem.title);
  })
  test("Add Menu Item (as diner)", async () => {
    const response = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${dinerToken}`).send(newMenuItem);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('unable to add menu item');
  })
})

describe("POST", () => {
  let tempDiner;
  let tempMenuItem;
  let tempFranchise;
  let tempStore;
  let token;
  const newOrder = {
    franchiseId: undefined,
    storeId: undefined,
    items: []
  }
  beforeAll(async () => {
    tempDiner = await TH.createTempUser([Role.Diner]);
    tempMenuItem = await TH.createTempMenuItem();
    tempFranchise = await TH.createTempFranchise();
    tempStore = await TH.createTempStore(tempFranchise.id);
    newOrder.franchiseId = tempFranchise.id;
    newOrder.storeId = tempStore.id;
    newOrder.items.push(tempMenuItem);
    const response = await request(app).put('/api/auth/').send(tempDiner);
    token = response.body.token;
  })
  afterAll(async () => {
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempMenuItem(tempMenuItem.title);
    await TH.deleteTempUser(tempDiner.name);
  })
  test("Create Order", async () => {
    const response = await request(app).post('/api/order').set('Authorization', `Bearer ${token}`).send(newOrder);
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.order.diner.id).toBe(tempDiner.id);
  });
})