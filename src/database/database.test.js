const { DB } = require("./database");

test("Create pizza and make sure it's in the db", async () => {
  const menuItem = {
    title: "New item",
    description: "This is the new item",
    image: "pizza.png",
    price: 0.05,
  };

  await DB.addMenuItem(menuItem);
  const menu = (await DB.getMenu()).map((item) => {
    const { id, ...otherProps } = item;
    expect(id).toBeGreaterThanOrEqual(0);
    return otherProps;
  });

  expect(menu).toContainEqual(menuItem);
});
