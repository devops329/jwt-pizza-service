const request = require('supertest');
const app = require('../../src/service');   
//const testFranchiseInfo = {name: "pizzaPocket", admins: [{"email": "f@jwt.com"}]};
const { Role, DB } = require('../../src/database/database');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}
function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  }

async function createAdminUser(userName, email, password) {
    //loads an admin user into the database manually
  let user = { password: password, roles: [{ role: Role.Admin }] };
  user.name = userName
  user.email = email

  user = await DB.addUser(user);
  return { ...user, password: password };
}

let adminUser;
let testUserAuthToken;
let franchise;
let userId;
let franchiseId;
describe("franchise tests", ()=>{
    beforeAll(async () => {
        let userName = randomName();
        let email = userName + '@admin.com';
        let password = 'toomanysecrets'
        //create admin user
        let admin = await createAdminUser(userName, email, password);
        adminUser = {name : userName, email : email, password : password}
        //login and grab the auth token
        const loginRequest = await request(app).put('/api/auth').send(adminUser);
        testUserAuthToken = loginRequest.body.token;
        expect (loginRequest.status).toBe(200);
        expectValidJwt(loginRequest.body.token);
        
        //create a franchise
        let franchiseName = userName + "TestFranchise"
        franchise = {"name" : franchiseName, "admins" : [{"email" : email}]}
        const createRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(franchise)
        expect(createRes.status).toBe(200);
        userId = createRes.body.admins.id
        franchiseId = createRes.id
      });
    
    //test list all franchises
    test('list', async () => {
        const listRes = await request(app).get('/api/franchise')
        expect(listRes.status).toBe(200);
      });
    
    //list a users franchises
    test('list user franchises', async ()=>{
        const listRes = await request(app)
        .get(`/api/franchise/:${userId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        expect(listRes.status).toBe(200);
    })
    
    //delete a franchise
    test('delete franchise', async ()=>{
        const deleteRes = await request(app)
        .delete(`/api/franchise/:${franchiseId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toEqual("franchise deleted")
    })
    
    //create a new franchise store
    test('create store', async()=>{
        let storeName = randomName()
        const createRes = await request(app)
        .post(`/api/franchise/:${franchiseId}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({"franchiseId": franchiseId, "name":storeName})
        expect(createRes.status).toBe(200);
        expect(createRes.body.name).toEqual(storeName)
    })
    
    //delete a store
    test('delete store', async()=>{
        //create a store so I can remove it
        let storeName = randomName()
        const createRes = await request(app)
        .post(`/api/franchise/:${franchiseId}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({"franchiseId": franchiseId, "name":storeName})
        expect(createRes.status).toBe(200);
        let storeId = createRes.body.id;

        //delete that store
        const deleteRes = await request(app)
        .delete(`/api/franchise/:${franchiseId}/store/:${storeId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toEqual("store deleted")
    })
})
