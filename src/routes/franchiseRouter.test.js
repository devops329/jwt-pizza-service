const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const {
  getRandomEmail,
  getRandomString,
  registerAndLogin,
  registerUser,
  createUser,
  getTestFranchise,
  createTestFranchise,
  createFranchiseAndStore,
} = require("../jest/jestHelpers");
const { Role } = require("../model/model");

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5);
}

let testUser, testUserAuthToken;

async function getCurrentFranchise(franchiseId) {
  const res = await request(app).get(`/api/franchise`);
  expect(res.status).toEqual(200);
  return res.body.find((franchise) => franchise.id === franchiseId);
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
  const { loginRes, token, store } = await createFranchiseAndStore();

  const franchiseRes = await request(app)
    .get(`/api/franchise/${loginRes.body.user.id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(franchiseRes.status).toEqual(200);

  const { id, ...otherInfo } = franchiseRes.body[0].stores[0];
  expect(otherInfo).toEqual({ ...store, totalRevenue: 0 });
});

test("try to create store on an invalid franchise", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const storeRes = await request(app)
    .post(`/api/franchise/-1/store`)
    .set("Authorization", `Bearer ${loginRes.body.token}`);
  expect(storeRes.status).toEqual(403);
});

test("delete store", async () => {
  const { token, store, franchiseId, storeRes } =
    await createFranchiseAndStore();

  const deleteRes = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeRes.body.id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(deleteRes.status).toEqual(200);

  const currentFranchise = await getCurrentFranchise(franchiseId);
  expect(currentFranchise).toBeDefined();
  expect(currentFranchise.stores).not.toContainEqual(store);
});

test("delete franchise", async () => {
  const adminUser = await createUser(Role.Admin);
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;

  const testFranchise = getTestFranchise(adminUser);
  const franchiseRes = await createTestFranchise(testFranchise, token);
  expect(franchiseRes.status).toEqual(200);
  expect(franchiseRes.body).toMatchObject(testFranchise);

  const currentFranchise = await getCurrentFranchise(franchiseRes.body.id);
  expect(currentFranchise).toBeDefined();

  const deleteRes = await request(app)
    .delete(`/api/franchise/${franchiseRes.body.id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(deleteRes.status).toEqual(200);

  const deletedFranchise = await getCurrentFranchise(franchiseRes.body.id);
  expect(deletedFranchise).not.toBeDefined();
});
