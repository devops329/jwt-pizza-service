const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test("register", async () => {
  const user = { name: "pizza diner", email: "reg@test.com", password: "a" };
  user.email = Math.random().toString(36).substring(2, 12) + "@test.com";

  const regRes = await request(app).post("/api/auth").send(user);
  expect(regRes.status).toBe(200);
});

test("register without password", async () => {
  const user = { name: "pizza diner", email: "reg@test.com" };
  user.email = Math.random().toString(36).substring(2, 12) + "@test.com";

  const regRes = await request(app).post("/api/auth").send(user);
  expect(regRes.status).toBe(400);
});

test("register without email", async () => {
  const user = { name: "pizza diner", password: "a" };

  const regRes = await request(app).post("/api/auth").send(user);
  expect(regRes.status).toBe(400);
});

test("register without name", async () => {
  const user = { email: "reg@test.com", password: "a" };

  const regRes = await request(app).post("/api/auth").send(user);
  expect(regRes.status).toBe(400);
});

test("logout", async () => {
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(logoutRes.status).toBe(200);
});

test("logout without token", async () => {
  const logoutRes = await request(app).delete("/api/auth");
  expect(logoutRes.status).toBe(401);
});

// {
//     method: 'POST',
//     path: '/api/auth',
//     description: 'Register a new user',
//     example: `curl -X POST localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`,
//     response: { user: { id: 2, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'tttttt' },
//   },
