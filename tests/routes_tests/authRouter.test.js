const request = require('supertest');
const app = require('../../src/service');   

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserID;
//test register
beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserID = registerRes.body.user.id;
  expectValidJwt(testUserAuthToken);
});
//test login
test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

//test update user
test("update user", async ()=>{
    let newEmail = 'new@email.com'
    let password = 'newpass'
    //put request with path /api/auth/:userId
    const updateRes = (await request(app)
    .put(`/api/auth/${testUserID}`)
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ email: newEmail, password: password })
  );
    expect (updateRes.status).toBe(200);
    expect(updateRes.body.email).toMatch(newEmail);
    
    //test below logs in to verify password
    const loginRes = await request(app).put('/api/auth').send({name: 'pizza diner', email: newEmail, password: password});
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
  })


//test logout
test('logout', async () =>{
    //const loginRes = await request(app).put('/api/auth').send(testUser);
    const logoutRes = (await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`));
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toEqual("logout successful");
})

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}