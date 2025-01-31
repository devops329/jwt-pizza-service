const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const {
  getRandomEmail,
  getRandomString,
  registerAndLogin,
  registerUser,
  createAdminUser,
} = require("../jest/jestHelpers");
const { Role } = require("../model/model");

let testUser, testUserAuthToken;

function getTestFranchise(adminUser) {
  return {
    name: getRandomString(),
    admins: [{ email: adminUser.email }],
  };
}

beforeAll(async () => {
  const { user, token } = await registerUser();
  testUser = user;
  testUserAuthToken = token;
});

test("get franchises", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const res = await request(app).get("/api/franchise");
  console.log(res.body);
  expect(res.status).toEqual(200);
  expect(res.body.length).toBeDefined();
});

test("create franchise", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const testFranchise = getTestFranchise(adminUser);
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${loginRes.body.token}`)
    .send(testFranchise);

  expect(res.status).toEqual(200);
  expect(res.body).toMatchObject(testFranchise);
});

test("can't create franchise as non admin", async () => {
  await request(app).put("/api/auth").send(testUser);

  const testFranchise = getTestFranchise(testUser);
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testFranchise);
  expect(res.status).toEqual(403);
});

test("can't create franchise with invalid user", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);

  const testFranchise = getTestFranchise(testUser);
  testFranchise.admins.push({ email: 'not.an.email@test.com'})
  
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${loginRes.body.token}`)
    .send(testFranchise);
  expect(res.status).toEqual(404);
});
