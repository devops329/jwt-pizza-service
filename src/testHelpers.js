const { DB } = require('./database/database');
const { Role } = require('./model/model');
const bcrypt = require('bcrypt');

function randomId() {
  return Math.floor(Math.random() * 1000000);
}

function isAMenuItem(item) {
  expect(typeof item).toBe('object');
  expect(item).toHaveProperty('id');
  expect(item).toHaveProperty('title');
  expect(item).toHaveProperty('description');
  expect(item).toHaveProperty('price');
  expect(item).toHaveProperty('image');
}

function isAUser(user) {
  expect(typeof user).toBe('object');
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('roles');
  expect(Array.isArray(user.roles)).toBe(true);
  user.roles.forEach(role => {
    expect(role).toHaveProperty('role');
    expect(Object.values(Role).includes(role.role)).toBe(true);
  });
}

function isAnOrderItem(item) {
  expect(typeof item).toBe('object');
  expect(item).toHaveProperty('id');
  expect(item).toHaveProperty('menuId');
  expect(item).toHaveProperty('description');
  expect(item).toHaveProperty('price');
}

function isAnOrder(order) {
  expect(typeof order).toBe('object');
  expect(order).toHaveProperty('id');
  expect(order).toHaveProperty('franchiseId');
  expect(order).toHaveProperty('storeId');
  expect(order).toHaveProperty('date');
  expect(order).toHaveProperty('items');
  expect(Array.isArray(order.items)).toBe(true);
  order.items.forEach(isAnOrderItem);
}

/**
 * 
 * @param {@import('./model/model').Role[]} roles
 * @param {[number]} franchiseId
 * @returns 
 */
async function createTempUser(roles, franchiseId) {
  const tempUser = {
    name: `Test User ${randomId()}`,
    email: `testuser${randomId()}@jwt.com`,
    password: "testpassword",
    roles: roles.map(role => ({role})),
  }
  if (franchiseId) {
    const matchingRole = tempUser.roles.find(role => role.role === Role.Franchisee);
    matchingRole.objectId = franchiseId;
  }
  const connection = await DB.getConnection();
  const hashedPassword = await bcrypt.hash(tempUser.password, 10);
  const response = await DB.query(connection, 'INSERT INTO user (name, email, password) VALUES (?, ?, ?)', [tempUser.name, tempUser.email, hashedPassword]);
  tempUser.id = response.insertId;
  for (const role of tempUser.roles) {
    if (!(role.role === Role.Franchisee && role.objectId === undefined)) {
      await DB.query(connection, 'INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)', [response.insertId, role.role, role.objectId || 0]);
    }
  }
  connection.end();
  return tempUser;
}

async function deleteTempUser(name) {
  const connection = await DB.getConnection();
  await DB.query(connection, 'DELETE FROM userRole where userId = (SELECT id FROM user WHERE name = ?)', [name]);
  await DB.query(connection, 'DELETE FROM user WHERE name = ?', [name]);
  connection.end();
}

async function createTempFranchise() {
  const tempFranchise = {
    name: `Test Franchise ${randomId()}`,
  }
  const connection = await DB.getConnection();
  const response = await DB.query(connection, 'INSERT INTO franchise (name) VALUES (?)', [tempFranchise.name]);
  tempFranchise.id = response.insertId;
  connection.end();
  return tempFranchise;
}

async function deleteTempFranchise(name) {
  const connection = await DB.getConnection();
  await DB.query(connection, 'DELETE FROM franchise WHERE name = ?', [name]);
  connection.end();
}

async function createTempStore(franchiseId) {
  const tempStore = {
    name: `Test Store ${randomId()}`,
    franchiseId,
  }
  const connection = await DB.getConnection();
  const response = await DB.query(connection, 'INSERT INTO store (name, franchiseId) VALUES (?, ?)', [tempStore.name, tempStore.franchiseId]);
  tempStore.id = response.insertId;
  connection.end();
  return tempStore;
}

async function deleteTempStore(name) {
  const connection = await DB.getConnection();
  await DB.query(connection, 'DELETE FROM store WHERE name = ?', [name]);
  connection.end();
}

async function createTempMenuItem() {
  const tempMenuItem = {
    title: `Test Item ${randomId()}`,
    description: "Test Description",
    price: 10.99,
    image: "https://example.com/image.jpg",
  }
  const connection = await DB.getConnection();
  const response = await DB.query(connection, 'INSERT INTO menu (title, description, price, image) VALUES (?, ?, ?, ?)', [tempMenuItem.title, tempMenuItem.description, tempMenuItem.price, tempMenuItem.image]);
  tempMenuItem.id = response.insertId;
  tempMenuItem.menuId = tempMenuItem.id;
  connection.end();
  return tempMenuItem;
}

async function deleteTempMenuItem(title) {
  const connection = await DB.getConnection();
  await DB.query(connection, 'DELETE FROM menu WHERE title = ?', [title]);
  connection.end();
}

async function createTempOrder(userId, franchiseId, storeId) {
  const tempOrder = {};
  const connection = await DB.getConnection();
  const response = await DB.query(connection, 'INSERT INTO `dinerOrder` (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())', [userId, franchiseId, storeId]);
  tempOrder.id = response.insertId;
  connection.end();
  return tempOrder;
}

async function deleteTempOrder(id) {
  const connection = await DB.getConnection();
  await DB.query(connection, 'DELETE FROM `orderItem` WHERE orderId = ?', [id]);
  await DB.query(connection, 'DELETE FROM `dinerOrder` WHERE id = ?', [id]);
  connection.end();
}

async function addTempOrderItem(orderId, menuItemId) {
  const tempItem = {
    orderId,
    menuItemId,
    description: "a test item",
    price: 14.99,
  }
  const connection = await DB.getConnection();
  await DB.query(connection, 'INSERT INTO `orderItem` (orderId, menuId, description, price) VALUES (?, ?, ?, ?)', [tempItem.orderId, tempItem.menuItemId, tempItem.description, tempItem.price]);
  connection.end();
  return tempItem;
}

module.exports = {
  isAMenuItem,
  isAUser,
  isAnOrderItem,
  isAnOrder,
  createTempUser,
  deleteTempUser,
  createTempFranchise,
  deleteTempFranchise,
  createTempStore,
  deleteTempStore,
  createTempMenuItem,
  deleteTempMenuItem,
  createTempOrder,
  deleteTempOrder,
  addTempOrderItem,
  randomId,
}