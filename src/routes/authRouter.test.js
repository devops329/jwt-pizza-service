const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

function getRandomString() {
  return Math.random().toString(36).substring(2, 12);
}

function getRandomEmail() {
  return getRandomString() + "@test.com";
}

const tokenRegex = /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/;

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

beforeEach(async () => {
  testUser.email = getRandomEmail();
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test("docs", async () => {
  const res = await request(app).get("/api/docs").send();
  expect(res.status).toBe(200);
  expect(() => JSON.parse(res)).toThrow();
  expect(() => JSON.parse(res.text)).not.toThrow();
});

test("login", async () => {
  const res = await request(app).put("/api/auth").send(testUser);
  expect(res.status).toBe(200);
  expect(res.body.token).toMatch(tokenRegex);

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(res.body.user).toMatchObject(user);
});

test("wrong password", async () => {
  const res = await request(app)
    .put("/api/auth")
    .send({ ...testUser, password: "ab" });
  expect(res.status).toBe(404);
});

test("register", async () => {
  const newUser = { ...testUser, email: getRandomEmail() };
  const res = await request(app).post("/api/auth").send(newUser);
  expect(res.status).toBe(200);
  expect(res.body.token).toMatch(tokenRegex);

  const { password, ...user } = { ...newUser, roles: [{ role: "diner" }] };
  expect(res.body.user).toMatchObject(user);
});

test("duplicate register", async () => {
  const newUser = { ...testUser, email: getRandomEmail() };
  const res = await request(app).post("/api/auth").send(newUser);
  expect(res.status).toBe(200);
  const res2 = await request(app).post("/api/auth").send(newUser);
  expect(res2.status).toBe(500);
});

test("no email register", async () => {
  const newUser = { ...testUser, email: null };
  const res = await request(app).post("/api/auth").send(newUser);
  expect(res.status).toBe(400);
});

test("logout", async () => {
  await request(app).put("/api/auth").send(testUser);
  const res = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toEqual(200);

  const failRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(failRes.status).toEqual(401);
});

test("invalid token", async () => {
  await request(app).put("/api/auth").send(testUser);
  const res = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer invalid-token`);
  expect(res.status).toEqual(401);
});

test("no token", async () => {
  await request(app).put("/api/auth").send(testUser);
  const res = await request(app).delete("/api/auth").send();
  expect(res.status).toEqual(401);
});

test("user update", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  const newInfo = { email: getRandomEmail(), password: getRandomString() };
  const updateRes = await request(app)
    .put(`/api/auth/${loginRes.body.user.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(newInfo);
  expect(updateRes.status).toEqual(200);

  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(logoutRes.status).toEqual(200);

  const failLogin = await request(app).put("/api/auth").send(testUser);
  expect(failLogin.status).toEqual(404);

  const succeedLogin = await request(app)
    .put("/api/auth")
    .send({ ...testUser, ...newInfo });
  expect(succeedLogin.status).toEqual(200);
});
