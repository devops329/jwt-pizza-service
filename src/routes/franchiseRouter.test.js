const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const {
  getRandomEmail,
  getRandomString,
  registerAndLogin,
  registerUser,
  createUser,
} = require("../jest/jestHelpers");
const { Role } = require("../model/model");

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5);
}

let testUser, testUserAuthToken;

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

beforeAll(async () => {
  const { user, token } = await registerUser();
  testUser = user;
  testUserAuthToken = token;
});

test("get franchises", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const res = await request(app).get("/api/franchise");
  expect(res.status).toEqual(200);
  expect(res.body.length).toBeDefined();
});

test("create franchise", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const testFranchise = getTestFranchise(adminUser);
  const res = await createTestFranchise(testFranchise, loginRes.body.token);

  expect(res.status).toEqual(200);
  expect(res.body).toMatchObject(testFranchise);
});

test("can't create franchise as non admin", async () => {
  await request(app).put("/api/auth").send(testUser);

  const testFranchise = getTestFranchise(testUser);
  const res = await createTestFranchise(testFranchise, testUserAuthToken);
  expect(res.status).toEqual(403);
});

test("can't create franchise with invalid user", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const testFranchise = getTestFranchise(testUser);
  testFranchise.admins.push({ email: "not.an.email@test.com" });

  const res = await createTestFranchise(testFranchise, loginRes.body.token);
  expect(res.status).toEqual(404);
});

test("create store", async () => {
  const adminUser = await createUser(Role.Admin);
  const adminLoginRes = await request(app).put("/api/auth").send(adminUser);

  const testFranchise = getTestFranchise(adminUser);
  const res = await createTestFranchise(
    testFranchise,
    adminLoginRes.body.token
  );
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

  const franchiseRes = await request(app)
    .get(`/api/franchise/${loginRes.body.user.id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(franchiseRes.status).toEqual(200);

  const { id, ...otherInfo } = franchiseRes.body[0].stores[0];
  expect(otherInfo).toEqual({ ...store, totalRevenue: 0 });
});
