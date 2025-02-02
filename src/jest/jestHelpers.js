const request = require("supertest");
const app = require("../service");
const { Role } = require("../model/model");
const { DB } = require("../database/database");

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

module.exports = {
  getRandomString,
  getRandomEmail,
  registerUser,
  registerAndLogin,
  createUser,
};
