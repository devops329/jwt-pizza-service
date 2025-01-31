const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeEach(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
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
  expect(res.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(res.body.user).toMatchObject(user);
});

test("wrong password", async () => {
  const res = await request(app)
    .put("/api/auth")
    .send({ ...testUser, password: "ab" });
  console.log(res.error);
  expect(res.status).toBe(404);
});
