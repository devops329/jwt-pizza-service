import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response

  const vars = {}

  group('Login and Order - https://pizza.myjwtpizza.click/', function () {
    // Homepage
    response = http.get('https://pizza.myjwtpizza.click/', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.5',
        'cache-control': 'max-age=0',
        'if-modified-since': 'Thu, 13 Mar 2025 20:33:39 GMT',
        'if-none-match': '"755b1150b4477dcbd24714893c624da1"',
        priority: 'u=0, i',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'sec-gpc': '1',
        'upgrade-insecure-requests': '1',
      },
    })
    sleep(12.7)

    // Login
    response = http.put(
      'https://pizza-service.myjwtpizza.click/api/auth',
      '{"email":"a@jwt.com","password":"admin"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.5',
          'content-type': 'application/json',
          origin: 'https://pizza.myjwtpizza.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'sec-gpc': '1',
        },
      }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }

    vars['token1'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(19.9)

    // Menu
    response = http.get('https://pizza-service.myjwtpizza.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.5',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        origin: 'https://pizza.myjwtpizza.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
      },
    })

    // Franchise
    response = http.get('https://pizza-service.myjwtpizza.click/api/franchise', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.5',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        origin: 'https://pizza.myjwtpizza.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
      },
    })
    sleep(11.7)

    // Purchase Pizza
    response = http.post(
      'https://pizza-service.myjwtpizza.click/api/order',
      '{"items":[{"menuId":4,"description":"Crusty","price":0.0028}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.5',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.myjwtpizza.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'sec-gpc': '1',
        },
      }
    )

    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Purchase was *not* 200');
    }

    vars['jwtToken'] = jsonpath.query(response.json(), '$.jwt');

    // Verify Pizza
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      `{"jwt": "${vars['jwtToken']}"}`,
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.5',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.myjwtpizza.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'sec-gpc': '1',
        },
      }
    )

  })
}