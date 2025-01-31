const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const {
  getRandomEmail,
  getRandomString,
  registerAndLogin,
  registerUser,
} = require("../jest/jestHelpers");
const { Role } = require("../model/model");

let testUser, testUserAuthToken, testMenuItem;

async function createAdminUser() {
  const password = getRandomString();
  let user = {
    name: getRandomString(),
    email: getRandomEmail(),
    password,
    roles: [{ role: Role.Admin }],
  };

  user = await DB.addUser(user);
  return { ...user, password };
}

beforeAll(async () => {
  const { user, token } = await registerUser();
  testUser = user;
  testUserAuthToken = token;
});

beforeEach(() => {
  testMenuItem = {
    title: getRandomString(),
    description: getRandomString(),
    image: "pizza.png",
    price: 0.05,
  };
});

test("add menu item and check results", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  expect(loginRes.status).toEqual(200);

  const addRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${loginRes.body.token}`)
    .send(testMenuItem);
  expect(addRes.status).toEqual(200);

  const getRes = await request(app)
    .get("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
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

// test("create order", async () => {
//   await request(app).put("/api/auth").send(testUser);

//   const addRes = await request(app)
//     .post("/api/order/menu")
//     .set("Authorization", `Bearer ${testUserAuthToken}`)
// });
