const { DB } = require('./database');
const { Role } = require('../model/model');
const jwt = require('jsonwebtoken');
const TH = require('../testHelpers.js');


describe("Get Menu Tests", () => {
  let tempMenuItem;
  beforeAll(async () => {
    tempMenuItem = await TH.createTempMenuItem();
  })
  afterAll(async () => {
    await TH.deleteTempMenuItem(tempMenuItem.title);
  })
  test("Get Menu", async () => {
    const rows = await DB.getMenu();
    expect(rows).not.toBeNull();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    const matchingRow = rows.find(row => row.title === tempMenuItem.title);
    expect(matchingRow).not.toBeUndefined();
    TH.isAMenuItem(matchingRow)
    expect(matchingRow.title).toBe(tempMenuItem.title);
  });
})

describe("Add Menu Items", () => {
  const newMenuItem = {
    title: `Test Item ${TH.randomId()}`,
    description: "Test Description",
    price: 10.99,
    image: "https://example.com/image.jpg",
  }
  afterAll(async () => {
    await TH.deleteTempMenuItem(newMenuItem.title);
  });

  test("Add Menu Item", async () => {
    const result = await DB.addMenuItem(newMenuItem);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
    TH.isAMenuItem(result);
  })
});

describe("Add New Users", () => {
  const newDiner = {
    name: `Test User ${TH.randomId()}`,
    email: `testuser${TH.randomId()}@jwt.com`,
    password: "testpassword",
    roles: [{role: Role.Diner}],
  }
  const newAdmin = {
    name: `Test Admin ${TH.randomId()}`,
    email: `testAdmin${TH.randomId()}@jwt.com`,
    password: "testpassword",
    roles: [{role: Role.Admin}],
  }
  const newFranchisee = {
    name: `Test Franchisee ${TH.randomId()}`,
    email: `testFranchisee${TH.randomId()}@jwt.com`,
    password: "testpassword",
    roles: [{role: Role.Franchisee, object: `Test Franchise ${TH.randomId()}`}],
  }
  let tempFranchise;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
    newFranchisee.roles[0].object = tempFranchise.name;
  })
  afterAll(async () => {
    await TH.deleteTempUser(newDiner.name);
    await TH.deleteTempUser(newAdmin.name);
    await TH.deleteTempUser(newFranchisee.name);
    await TH.deleteTempFranchise(tempFranchise.name);
  });
  test("Add New Diner", async () => {
    const result = await DB.addUser(newDiner);
    TH.isAUser(result);
    expect(result.roles.length).toBe(1);
    expect(result.roles[0]).toHaveProperty('role', Role.Diner);
  })
  test("Add New Admin", async () => {
    const result = await DB.addUser(newAdmin);
    TH.isAUser(result);
    expect(result.roles.length).toBe(1);
    expect(result.roles[0]).toHaveProperty('role', Role.Admin);
  })
  test("Add New Franchisee", async () => {
    const result = await DB.addUser(newFranchisee);
    TH.isAUser(result);
    expect(result.roles.length).toBe(1);
    expect(result.roles[0]).toHaveProperty('role', Role.Franchisee);
  })
})

describe("Get Users", () => {
  let tempUser;
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
  });
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
  });
  test("Get User", async () => {
    const result = await DB.getUser(tempUser.email, tempUser.password);
    TH.isAUser(result);
  });
  test("Get User with incorrect password", async () => {
    expect(DB.getUser(tempUser.email, "incorrectpassword")).rejects.toThrow();
  })
});

describe("Update users", () => {
  let tempUser;
  const newUserInfo = {
    email: `newemail${TH.randomId()}@jwt.com`,
    password: "newpassword",
  };
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
  });
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
  });
  test("Update User", async () => {
    const result = await DB.updateUser(tempUser.id, newUserInfo.email, newUserInfo.password);
    TH.isAUser(result);
    expect(result?.password === undefined).toBe(true);
    expect(result.email).toBe(newUserInfo.email);
  });
});

describe("Login Users", () => {
  let tempUser;
  let token;
  let tokenSignature;
  beforeAll(async () => {
    const importedConfig = require('../config.js');
    const jwtSecret = importedConfig.jwtSecret;
    tempUser = await TH.createTempUser([Role.Diner]);
    token = jwt.sign(tempUser, jwtSecret);
    tokenSignature = DB.getTokenSignature(token);
  });
  afterAll(async () => {
    const connection = await DB.getConnection();
    await DB.query(connection, `DELETE FROM auth WHERE userId=?`, [tempUser.id]);
    await TH.deleteTempUser(tempUser.name);
    connection.end();
  });
  test("Login User", async () => {
    const result = await DB.loginUser(tempUser.id, token);
    expect(result).toBe(undefined);
  });
});

describe("Is Logged In Tests", () => {
  let tempUser;
  let token;
  let tokenSignature;
  beforeAll(async () => {
    const importedConfig = require('../config.js');
    const jwtSecret = importedConfig.jwtSecret;
    tempUser = await TH.createTempUser([Role.Diner]);
    token = jwt.sign(tempUser, jwtSecret);
    tokenSignature = DB.getTokenSignature(token);
    const connection = await DB.getConnection();
    await DB.query(connection, `INSERT INTO auth (token, userId) VALUES (?, ?)`, [tokenSignature, tempUser.id]);
    connection.end();
  });
  afterAll(async () => {
    const connection = await DB.getConnection();
    await DB.query(connection, `DELETE FROM auth WHERE token=?`, [tokenSignature]);
    await TH.deleteTempUser(tempUser.name);
    connection.end();
  });
  test("Is Logged In", async () => {
    const result = await DB.isLoggedIn(token);
    expect(result).toBe(true);
  });
});

describe("Logout Users", () => {
  let tempUser;
  let token;
  let tokenSignature;
  beforeAll(async () => {
    const importedConfig = require('../config.js');
    const jwtSecret = importedConfig.jwtSecret;
    tempUser = await TH.createTempUser([Role.Diner]);
    token = jwt.sign(tempUser, jwtSecret);
    tokenSignature = DB.getTokenSignature(token);
    const connection = await DB.getConnection();
    await DB.query(connection, `INSERT INTO auth (token, userId) VALUES (?, ?)`, [tokenSignature, tempUser.id]);
    connection.end();
  });
  afterAll(async () => {
    const connection = await DB.getConnection();
    await DB.query(connection, `DELETE FROM auth WHERE token=?`, [tokenSignature]);
    await TH.deleteTempUser(tempUser.name);
    connection.end();
  });
  test("Logout user", async () => {
    const result = await DB.logoutUser(token);
    expect(result).toBe(undefined);
  });
});

describe("Get Orders Tests", () => {
  let tempUser;
  let tempFranchise;
  let tempStore;
  let tempOrder;
  let tempMenuItem;
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
    tempFranchise = await TH.createTempFranchise();
    tempStore = await TH.createTempStore(tempFranchise.id);
    tempOrder = await TH.createTempOrder(tempUser.id, tempFranchise.id, tempStore.id);
    tempMenuItem = await TH.createTempMenuItem();
  });
  afterAll(async () => {
    await TH.deleteTempMenuItem(tempMenuItem.title);
    await TH.deleteTempOrder(tempOrder.id);
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempUser(tempUser.name);
  });
  test("Get Order with no items", async () => {
    const result = await DB.getOrders(tempUser);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('orders');
    expect(Array.isArray(result.orders)).toBe(true);
    expect(result.orders.length).toBe(1);
    expect(TH.isAnOrder(result.orders[0]));
    expect(result.orders[0].items.length).toBe(0);
  });
  test("Get Order with items", async () => {
    await TH.addTempOrderItem(tempOrder.id, tempMenuItem.id);
    const result = await DB.getOrders(tempUser);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('orders');
    expect(Array.isArray(result.orders)).toBe(true);
    expect(result.orders.length).toBe(1);
    expect(TH.isAnOrder(result.orders[0]));
    expect(result.orders[0].items.length).toBeGreaterThan(0);
  });
});

describe("Add Orders Tests", () => {
  let tempUser;
  let tempFranchise;
  let tempStore;
  let tempMenuItem;
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Diner]);
    tempFranchise = await TH.createTempFranchise();
    tempStore = await TH.createTempStore(tempFranchise.id);
    tempMenuItem = await TH.createTempMenuItem();
  })
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempMenuItem(tempMenuItem.title);
  })
  afterEach(async () => {
    const connection = await DB.getConnection();
    await DB.query(connection, `DELETE FROM orderItem WHERE orderId IN (SELECT id FROM dinerOrder WHERE dinerId=?)`, [tempUser.id]);
    await DB.query(connection, `DELETE FROM dinerOrder WHERE dinerId=?`, [tempUser.id]);
    connection.end();
  })
  test("Add Empty Order", async () => {
    const newOrder = {
      franchiseId: tempFranchise.id,
      storeId: tempStore.id,
      items: [],
    }
    const result = await DB.addDinerOrder(tempUser, newOrder);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('franchiseId', tempFranchise.id);
    expect(result).toHaveProperty('storeId', tempStore.id);
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(0);
  })
  test("Add Order with Items", async () => {
    const newOrder = {
      franchiseId: tempFranchise.id,
      storeId: tempStore.id,
      items: [tempMenuItem],
    }
    const result = await DB.addDinerOrder(tempUser, newOrder);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('franchiseId', tempFranchise.id);
    expect(result).toHaveProperty('storeId', tempStore.id);
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(1);
  })
})

describe("Create Franchise Tests", () => {
  let tempUser;
  const fakeUser = {
    name: `Fake User ${TH.randomId()}`,
    email: `fakeuser${TH.randomId()}@jwt.com`,
    password: "fakepassword",
  }
  const newFranchise = {
    name: `Test Franchise ${TH.randomId()}`,
    admins: [tempUser],
  }
  beforeAll(async () => {
    tempUser = await TH.createTempUser([Role.Franchisee]);
    newFranchise.admins[0] = tempUser;
  })
  afterAll(async () => {
    await TH.deleteTempUser(tempUser.name);
  })
  afterEach(async () => {
    const connection = await DB.getConnection();
    await DB.query(connection, 'DELETE FROM userRole where userId = ? and role = ?', [tempUser.id, Role.Franchisee]);
    await DB.query(connection, 'DELETE FROM franchise WHERE name = ?', [newFranchise.name]);
    connection.end();
  })
  test("Create Franchise", async () => {
    const newFranchise = {
      name: `Test Franchise ${TH.randomId()}`,
      admins: [tempUser],
    }
    const result = await DB.createFranchise(newFranchise);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', newFranchise.name);
    expect(result).toHaveProperty('admins');
    expect(Array.isArray(result.admins)).toBe(true);
    expect(result.admins.length).toBe(1);
    expect(result.admins[0].id).toBe(tempUser.id);
  })
  test("Create Franchise with unknown user", async () => {
    const newFranchise = {
      name: `Test Franchise ${TH.randomId()}`,
      admins: [fakeUser],
    }
    expect(DB.createFranchise(newFranchise)).rejects.toThrow();
  })
})

describe("Delete Franchise Tests", () => {
  let tempFranchise;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
  })
  beforeEach(async () => {
    if (tempFranchise) {
      await TH.deleteTempFranchise(tempFranchise.name);
    }
    tempFranchise = await TH.createTempFranchise();
  })
  afterAll(async () => {
    await TH.deleteTempFranchise(tempFranchise.name);
  })
  test("Delete Franchise", async () => {
    const result = await DB.deleteFranchise(tempFranchise.id);
    expect(result).toBe(undefined);
  })
})

describe("Get Franchises Tests", () => {
  let tempFranchise;
  let tempUser;
  let tempAdmin;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
    tempUser = await TH.createTempUser([Role.Diner]);
    tempAdmin = await TH.createTempUser([Role.Admin]);
    tempUser.isRole = (role) => !!tempUser.roles.find((r) => r.role === role);
    tempAdmin.isRole = (role) => !!tempAdmin.roles.find((r) => r.role === role);
  })
  afterAll(async () => {
    await TH.deleteTempFranchise(tempFranchise.name);
    await TH.deleteTempUser(tempUser.name);
    await TH.deleteTempUser(tempAdmin.name);
  })
  
  test("Get Franchises as diner", async () => {
    const result = await DB.getFranchises(tempUser);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const matchingFranchise = result.find(franchise => franchise.name === tempFranchise.name);
    expect(matchingFranchise).not.toBeUndefined();
    expect(matchingFranchise).toHaveProperty('id', tempFranchise.id);
  })
  test("Get Franchises as admin", async () => {
    const result = await DB.getFranchises(tempAdmin);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const matchingFranchise = result.find(franchise => franchise.name === tempFranchise.name);
    expect(matchingFranchise).not.toBeUndefined();
    expect(matchingFranchise).toHaveProperty('id', tempFranchise.id);
    expect(matchingFranchise).toHaveProperty('admins');
  })
})

describe("Get User Franchises Tests", () => {
  let tempUser;
  let tempFranchise;
  let tempStore;
  let tempUser2;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
    tempUser = await TH.createTempUser([Role.Franchisee], tempFranchise.id);
    tempUser2 = await TH.createTempUser([Role.Franchisee]);
    tempStore = await TH.createTempStore(tempFranchise.id);
  })
  afterAll(async () => {
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempUser(tempUser.name);
    await TH.deleteTempUser(tempUser2.name);
    await TH.deleteTempFranchise(tempFranchise.name);
  })
  test("Get Franchises as Franchisee with a franchise", async () => {
    const result = await DB.getUserFranchises(tempUser.id);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('id', tempFranchise.id);
    expect(result[0]).toHaveProperty('name', tempFranchise.name);
    expect(result[0]).toHaveProperty('admins');
    expect(Array.isArray(result[0].admins)).toBe(true);
    expect(result[0].admins.length).toBe(1);
    expect(result[0].admins[0].id).toBe(tempUser.id);
  })

  test("Get Franchises as Franchisee without a franchise", async () => {
    const result = await DB.getUserFranchises(tempUser2.id);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test("Get Franchise Details", async () => {
    const result = await DB.getFranchise(tempFranchise);
    expect(result).toHaveProperty('id', tempFranchise.id);
    expect(result).toHaveProperty('name', tempFranchise.name);
    expect(result).toHaveProperty('admins');
    expect(Array.isArray(result.admins)).toBe(true);
    expect(result.admins.length).toBe(1);
    expect(result.admins[0].id).toBe(tempUser.id);
    expect(result).toHaveProperty('stores');
    expect(result.stores.length).toBe(1);
    expect(result.stores[0].id).toBe(tempStore.id);
  })
})

describe("Create Store Tests", () => {
  let tempFranchise;
  const newStore = {
    name: `Test Store ${TH.randomId()}`,
  }
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
  })
  afterEach(async () => {
    await TH.deleteTempStore(newStore.name);
  })
  afterAll(async () => {
    
    await TH.deleteTempFranchise(tempFranchise.name);
  })
  test("Create Store", async () => {
    const result = await DB.createStore(tempFranchise.id, newStore);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', newStore.name);
    expect(result).toHaveProperty('franchiseId', tempFranchise.id);
  })
})

describe("Delete Store Tests", () => {
  let tempStore;
  let tempFranchise;
  beforeAll(async () => {
    tempFranchise = await TH.createTempFranchise();
    tempStore = await TH.createTempStore(tempFranchise.id);
  })
  beforeEach(async () => {
    if (tempStore) {
      await TH.deleteTempStore(tempStore.name);
    }
    tempStore = await TH.createTempStore(tempFranchise.id);
  })
  afterAll(async () => {
    await TH.deleteTempStore(tempStore.name);
    await TH.deleteTempFranchise(tempFranchise.name);
  })
  test("Delete Store", async () => {
    const result = await DB.deleteStore(tempFranchise.id, tempStore.id);
    expect(result).toBe(undefined);
  })
})

describe("Various database tests", () => {
  test("getTokenSignature", () => {
    const response = DB.getTokenSignature("testtoken");
    expect(response).toBe('');
  })
  test("getID", async () => {
    const connection = await DB.getConnection();
    try {
      const errorMessage = '';
      await DB.getID(connection, 'name', `blahBleeBloo${TH.randomId()}`, 'user');
      expect(errorMessage.includes("No ID found")).toBe(true);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("No ID found");
    }
    connection.end();
  })
})