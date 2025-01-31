const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const { getRandomEmail, getRandomString, registerAndLogin } = require("../jest/jestHelpers");

let testUser, testUserAuthToken;

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
  const { user, token } = await registerAndLogin();
  testUser = user;
  testUserAuthToken = token;
});

// test("docs", async () => {
//   const res = await request(app).get("/api/docs").send();
//   expect(res.status).toBe(200);
//   expect(() => JSON.parse(res)).toThrow();
//   expect(() => JSON.parse(res.text)).not.toThrow();
// });