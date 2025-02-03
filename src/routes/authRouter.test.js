const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const {
  tokenRegex,
  registerUser,
  getRandomEmail,
  getRandomString,
} = require("../jest/jestHelpers");

let testUser, testUserAuthToken;

beforeEach(async () => {
  const { user, token } = await registerUser();
  testUser = user;
  testUserAuthToken = token;
});

test("root message", async () => {
  const res = await request(app).get("/").send();
  expect(res.status).toBe(200);
  const json = JSON.parse(res.text);
  expect(json.message).toEqual("welcome to JWT Pizza");
});

test("invalid route", async () => {
  const res = await request(app).get("/not/a/real/path").send();
  expect(res.status).toBe(404);
  const json = JSON.parse(res.text);
  expect(json.message).toEqual("unknown endpoint");
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
    .send({ ...testUser, password: "invalid-password" });
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
  expect(loginRes.status).toEqual(200);
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
