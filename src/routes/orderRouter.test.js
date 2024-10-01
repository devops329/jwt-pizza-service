const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database.js'); // Directly import DB and Role
const { createAdminUser, randomName } = require('./testHelpers.js');

let adminUser;
let adminUserAuthToken;

// Mock DB && Role
jest.mock('../database/database.js', () => ({
  DB: {
    getMenu: jest.fn(),
    addMenuItem: jest.fn(),
    addUser: jest.fn(),
  },
  Role: {
    Admin: 'Admin', 
  },
}));

beforeEach(() => {
  DB.getMenu.mockClear();
  DB.addMenuItem.mockClear();
  DB.addUser.mockClear();
});

beforeAll(async () => {
  // need to mock the DB.addUser function to return the user object
  DB.addUser.mockResolvedValue({
    id: 1,
    name: 'Test Admin',
    email: 'admin@example.com',
    roles: [{ role: 'Admin' }],
  });

  adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send({
    email: adminUser.email,
    password: adminUser.password,
  });

  adminUserAuthToken = loginRes.body.token;
    console.log('Generated Auth Token:', adminUserAuthToken);
});

test('GET /api/order/menu returns the pizza menu', async () => {
  const mockMenu = [
    { id: 1, title: 'bbq', image: 'pizza1.png', price: 0.0038, description: 'A man\'s pizza' },
  ];

  DB.getMenu.mockResolvedValue(mockMenu);

  const res = await request(app).get('/api/order/menu');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(mockMenu);
  expect(DB.getMenu).toHaveBeenCalledTimes(1);
});