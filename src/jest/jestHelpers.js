const request = require("supertest");
const app = require("../service");
const { Role } = require("../model/model");
const { DB } = require("../database/database");

const tokenRegex = /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/;

function getRandomString() {
  return Math.random().toString(36).substring(2, 12);
}

function getRandomEmail() {
  return getRandomString() + "@test.com";
}

async function registerUser() {
  const user = {
    name: "pizza diner",
    email: getRandomEmail(),
    password: getRandomString(),
  };
  const registerRes = await request(app).post("/api/auth").send(user);
  return { user, token: registerRes.body.token };
}

async function registerAndLogin() {
  const { user, token } = registerUser();
  const loginRes = await request(app).put("/api/auth").send(user);
  return { user, token };
}

async function createUser(role, franchise) {
  const password = getRandomString();
  let user = {
    name: getRandomString(),
    email: getRandomEmail(),
    password,
    roles: [{ role, object: franchise }],
  };

  user = await DB.addUser(user);
  return { ...user, password };
}

function getTestFranchise(adminUser) {
  return {
    name: getRandomString(),
    admins: [{ email: adminUser.email }],
  };
}

async function createTestFranchise(franchise, token) {
  return await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send(franchise);
}

async function createFranchiseAndStore() {
  const adminUser = await createUser(Role.Admin);
  const adminLoginRes = await request(app).put("/api/auth").send(adminUser);
  const adminToken = adminLoginRes.body.token;

  const testFranchise = getTestFranchise(adminUser);
  const res = await createTestFranchise(testFranchise, adminToken);
  const franchiseId = res.body.id;

  const franchiseeUser = await createUser(Role.Franchisee, testFranchise.name);
  const loginRes = await request(app).put("/api/auth").send(franchiseeUser);
  const token = loginRes.body.token;

  const store = { name: getRandomString() };
  const storeRes = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set("Authorization", `Bearer ${token}`)
    .send(store);
  expect(storeRes.status).toEqual(200);
  expect(storeRes.body).toMatchObject(store);

  return { loginRes, token, adminToken, store, franchiseId, storeRes };
}

module.exports = {
  tokenRegex,
  getRandomString,
  getRandomEmail,
  registerUser,
  registerAndLogin,
  createUser,
  getTestFranchise,
  createTestFranchise,
  createFranchiseAndStore,
};
