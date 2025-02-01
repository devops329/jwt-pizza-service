const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const testAdminUser = { name: 'pizza diner', email: 'reg@test.com', password: 'testpassword' , roles: [{role: Role.Admin}]};
const testUser = {name: 'Bob', email: 'reg@test.com', password: 'testpassword', roles: [{role: Role.Diner}]};
let AdminAuth;
let authHeader;
let randName;
let franchiseId;
let storeId;

function randomName(){
    return Math.random().toString(36).substring(2, 12);
}

async function loginUser(userData){
    let loginRes = await request(app).put('/api/auth').send(userData)
    return loginRes.body.token
}

beforeAll(async () => {
    randName = randomName()
    testAdminUser.email = randName + '@test.com';
    await DB.addUser(testAdminUser)
    await DB.addUser(testUser)
    AdminAuth = await loginUser(testAdminUser)
    authHeader = 'Bearer ' + AdminAuth
    const createRes = await request(app).post('/api/franchise').set('Authorization', authHeader).send({"name": randName, "admins": [{"email": testAdminUser.email}]})
    franchiseId = createRes.body.id
    const createstoreRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', authHeader).send({"franchiseId": franchiseId, "name": randName})
    storeId = createstoreRes.body.id
});

test('get menu test', async () => {
    const getRes = await request(app).get('/api/order/menu')
    expect(getRes.body.length).toBeGreaterThan(4)
})

test('add to menu test', async () => {
    const getRes = await request(app).get('/api/order/menu')
    let prevLength = getRes.body.length
    let pizzaObject = { "title": randName, "description": "testPizza", "image":"pizza9.png", "price": 0.0001 }
    const putRes = await request(app).put('/api/order/menu').set('Authorization', authHeader).send(pizzaObject)
    expect(prevLength).toBeLessThan(putRes.body.length)
})

test('get orders test', async () => {
    const getRes = await request(app).get('/api/order').set('Authorization', authHeader)
    expect(getRes.body.orders.length).toBe(0)
    let order = {"franchiseId": franchiseId, "storeId":storeId, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}
    await request(app).post('/api/order').set('Authorization', authHeader).send(order)
    let getRes2 = await request(app).get('/api/order').set('Authorization', authHeader)
    expect(getRes2.body.orders.length).toBe(1)
})