const request = require("supertest");
const app = require("../service");
const {
  tokenRegex,
  getRandomString,
  registerUser,
  createUser,
  createFranchiseAndStore,
} = require("../jest/jestHelpers");
const { Role } = require("../model/model");

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5);
}

let testUser, testUserAuthToken, testMenuItem;

beforeEach(async () => {
  const { user, token } = await registerUser();
  testUser = user;
  testUserAuthToken = token;

  testMenuItem = {
    title: getRandomString(),
    description: getRandomString(),
    image: "pizza.png",
    price: 0.05,
  };
});

test("add menu item and check results", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  expect(loginRes.status).toEqual(200);

  const addRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${loginRes.body.token}`)
    .send(testMenuItem);
  expect(addRes.status).toEqual(200);

  const getRes = await request(app).get("/api/order/menu");
  expect(addRes.body).toMatchObject(getRes.body);

  const menu = addRes.body.map((item) => {
    const { id, ...otherProps } = item;
    expect(id).toBeGreaterThanOrEqual(0);
    return otherProps;
  });
  expect(menu).toContainEqual(testMenuItem);
});

test("can't add menu item as non admin", async () => {
  await request(app).put("/api/auth").send(testUser);

  const addRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testMenuItem);
  expect(addRes.status).toEqual(403);
});

test("create order", async () => {
  const { franchiseId, storeRes, adminToken } = await createFranchiseAndStore();
  await request(app).put("/api/auth").send(testUser);

  const addRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(testMenuItem);
  expect(addRes.status).toEqual(200);
  const item = addRes.body.find((item) => item.title === testMenuItem.title);
  expect(item).toBeDefined();

  const testOrder = {
    franchiseId,
    storeId: storeRes.body.id,
    items: Array.from({ length: 3 }, () => ({
      menuId: item.id,
      description: item.title,
      price: item.price,
    })),
  };
  const orderRes = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testOrder);
  expect(orderRes.status).toEqual(200);
  expect(orderRes.body.order).toMatchObject(testOrder);
  expect(orderRes.body.jwt).toMatch(tokenRegex);

  const getRes = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testUser);
  expect(getRes.status).toEqual(200);

  expect(getRes.body.orders.length).toEqual(1);
  expect(getRes.body.orders[0]).toMatchObject(testOrder);
});

test("can't order something that doesn't exist", async () => {
  const { franchiseId, storeRes } = await createFranchiseAndStore();
  await request(app).put("/api/auth").send(testUser);

  const testOrder = {
    franchiseId,
    storeId: storeRes.body.id,
    items: [
      { menuId: "not-a-real-id", description: "description", price: "0.05" },
    ],
  };
  const orderRes = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testOrder);
  expect(orderRes.status).toEqual(500);

  const getRes = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testUser);
  expect(getRes.status).toEqual(200);
  expect(getRes.body.orders.length).toEqual(1);
  expect(getRes.body.orders[0].items.length).toEqual(0);
});
