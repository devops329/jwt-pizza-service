const request = require('supertest');
const app = require('../../src/service'); 
const { Role, DB } = require('../../src/database/database');

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

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let adminUser;
let adminUserAuthToken;
describe("order tests", ()=>{
    
    beforeEach(async ()=>{
        let userName = randomName();
        let email = userName + '@admin.com';
        let password = 'toomanysecrets'
        //create admin user
        await createAdminUser(userName, email, password);
        adminUser = {name : userName, email : email, password : password}
        //login and grab the auth token
        const loginRequest = await request(app).put('/api/auth').send(adminUser);
        adminUserAuthToken = loginRequest.body.token;
        expect (loginRequest.status).toBe(200);
        expectValidJwt(loginRequest.body.token);
    })
    
    test("get pizza menu", async ()=>{
        const getMenuRes = await request(app).get('/api/order/menu')
        expect(getMenuRes.status).toBe(200);
        //expect(getMenuRes.body.image.endsWith('.png')).toBe(true)
    })

    test("add item to menu", async ()=>{
        const addMenuRes = (await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${adminUserAuthToken}`)
        .send({ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 })
        )
        expect(addMenuRes.status).toBe(200)
        //FIXME add description checker
    })

    test("get auth user orders", async ()=>{
        const getAuthOrdersRes = (await request(app)
        .get('/api/order')
        .set('Authorization', `Bearer ${adminUserAuthToken}`)
        )
        expect(getAuthOrdersRes.status).toBe(200)
    })
    /*
    test("create a order for the auth user", async ()=>{
        const addMenuRes = (await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${adminUserAuthToken}`)
        .send({ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 })
        )
        expect(addMenuRes.status).toBe(200)
    })
        */

})