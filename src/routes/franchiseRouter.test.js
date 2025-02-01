const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const testAdminUser = { name: 'pizza diner', email: 'reg@test.com', password: 'testpassword' , roles: [{role: Role.Admin}]};
const testUser = {name: 'Bob', email: 'reg@test.com', password: 'testpassword', roles: [{role: Role.Diner}]};
let AdminAuth;
let authHeader;
let randName;
let franchiseId;
let bobAuth;

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
  user = await DB.addUser(testAdminUser)
  await DB.addUser(testUser)
  AdminAuth = await loginUser(testAdminUser)
  bobAuth = await loginUser(testUser)
  authHeader = 'Bearer ' + AdminAuth
  testAdminUserId = user.id
  const createRes = await request(app).post('/api/franchise').set('Authorization', authHeader).send({"name": randName, "admins": [{"email": testAdminUser.email}]})
  franchiseId = createRes.body.id
  expect(createRes.status).toBe(200)
});

afterAll(async () =>{
    await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', authHeader)
})

test('get franchises test', async () => {
  const getRes = await request(app).get('/api/franchise')
  expect(getRes.status).toBe(200);
  expect(getRes.body.length).toBeGreaterThan(2)
});

test('get user franchises test', async () => {
    const getRes = await request(app).get('/api/franchise/' + testAdminUserId).set('Authorization', authHeader)
    expect(getRes.status).toBe(200);
    expect(getRes.body[0].name).toBe(randName);
})

test('unauthorized create franchise test', async () => {
    let newRandName = randomName()
    const createRes = await request(app).post('/api/franchise').set('Authorization', 'Bearer ' + bobAuth).send({"name": newRandName, "admins": [{"email": testUser.email}]})
    expect(createRes.status).toBe(403)
})

test('delete franchise test', async () => {
    let newName = randomName()
    const createRes = await request(app).post('/api/franchise').set('Authorization', authHeader).send({"name": newName, "admins": [{"email": testAdminUser.email}]})
    let id = createRes.body.id
    const deleteRes = await request(app).delete(`/api/franchise/${id}`).set('Authorization', authHeader)
    expect(deleteRes.status).toBe(200)
    const checkIfExists = await request(app).get('/api/franchise/' + testAdminUserId).set('Authorization', authHeader)
    for(let i = 0; i < checkIfExists.body.length; i ++){
        expect(checkIfExists.body[i].id).not.toBe(id)
    }
})

test('unauthorized delete franchise test', async () => {
    const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', 'Bearer ' + bobAuth)
    expect(deleteRes.status).toBe(403)
})

test('create store test', async () => {
    const createRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', authHeader).send({"franchiseId": franchiseId, "name": randName})
    expect(createRes.status).toBe(200)
    expect(createRes.body.name).toBe(randName)
})

test('unauthorized create store test', async () => {
    let newRandName = randomName()
    const createRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', 'Bearer ' + bobAuth).send({"franchiseId": franchiseId, "name": newRandName})
    expect(createRes.status).toBe(403)
})

test('unauthorized delete store test', async () => {
    const createRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', authHeader).send({"franchiseId": franchiseId, "name": randName})
    let storeId = createRes.id
    const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', authHeader)
    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body.message).toBe("store deleted")
})

test('unauthorized delete store test', async () => {
    const createRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', authHeader).send({"franchiseId": franchiseId, "name": randName})
    let storeId = createRes.id
    const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', 'Bearer ' + bobAuth)
    expect(deleteRes.status).toBe(403)
})