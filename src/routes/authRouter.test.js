const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

function getRandomEmail() {
  return Math.random().toString(36).substring(2, 12) + "@test.com";
}

const tokenRegex = /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/;

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
