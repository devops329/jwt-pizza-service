const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  const name = randomName();
  const user = { name, email: name + '@admin.com', password: 'toomanysecrets', roles: [{ role: Role.Admin }] };

  await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}

async function loginUser(user) {
  const res = await request(app).put('/api/auth').send({ email: user.email, password: user.password });

  expect(res.status).toBe(200);
  
  return res.body;
}

async function createDiner() {
  const user = { name: randomName(), password: 'a' };
  user.email = user.name + '@diner.com';
  const res = await request(app).post('/api/auth').send(user);
  expect(res.status).toBe(200);

  return { user: res.body.user, token: res.body.token };
}

describe('addMenuItem', () => {
  test('an admin adds a menu item and it comes back in the menu', async () => {
    const admin = await createAdminUser();
    const adminToken = (await loginUser(admin)).token;

    const item = { title: randomName(), description: 'A test pizza', image: 'pizza9.png', price: 0.0001 };

    const res = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminToken}`).send(item);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((m) => m.title === item.title)).toBe(true);
  });

  test('a diner fails to add a menu item', async () => {
    const diner = await createDiner();
    const item = { title: randomName(), description: 'Forbidden food', image: 'pizza9.png', price: 0.0001 };

    const res = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${diner.token}`).send(item);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('unable to add menu item');
  });
});

describe('getMenu', () => {
  test('search returns only matching menu items', async () => {
    const admin = await createAdminUser();
    const adminToken = (await loginUser(admin)).token;

    const title = randomName();
    const item = { title, description: 'A searchable pizza', image: 'pizza9.png', price: 0.0001 };
    await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminToken}`).send(item);

    const res = await request(app).get(`/api/order/menu?search=${title}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe(title);
  });

  test('no search returns the full menu', async () => {
    const res = await request(app).get('/api/order/menu');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
