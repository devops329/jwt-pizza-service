const tableCreateStatements = [
  `CREATE TABLE IF NOT EXISTS auth (
    token VARCHAR(512) PRIMARY KEY,
    userId INT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(1024) NOT NULL,
    price DECIMAL(10, 8) NOT NULL,
    description TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS franchise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  )`,

  `CREATE TABLE IF NOT EXISTS store (
    id INT AUTO_INCREMENT PRIMARY KEY,
    franchiseId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (franchiseId) REFERENCES franchise(id)
  )`,

  `CREATE TABLE IF NOT EXISTS userRole (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    role VARCHAR(255) NOT NULL,
    objectId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id),
    INDEX (objectId)
  )`,

  `CREATE TABLE IF NOT EXISTS dinerOrder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dinerId INT NOT NULL,
    franchiseId INT NOT NULL,
    storeId INT NOT NULL,
    date DATETIME NOT NULL,
    INDEX (dinerId),
    INDEX (franchiseId),
    INDEX (storeId)
  )`,

  `CREATE TABLE IF NOT EXISTS orderItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    menuId INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    price DECIMAL(10, 8) NOT NULL,
    FOREIGN KEY (orderId) REFERENCES dinerOrder(id),
    INDEX (menuId)
  )`,
];

module.exports = { tableCreateStatements };
