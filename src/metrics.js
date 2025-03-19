const config = require('./config');
const os = require('os');

let requestsByMethod = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
let activeUsers = 0
let successfulAuthAttempts = 0
let failedAuthAttempts = 0
let pizzasMade = 0
let totalPrice = 0
let pizzaCreationFails = 0
let generalLatency = 0
let pizzaLatency = 0


//required metrics: 
// HTTP requests by method/minute, 
// Active users, 
// Authentication attempts/minute (and how many succeeded or failed), 
// cpu and mem usage, 
// pizza data (sold per min, creation fails, and revenue per min), 
// latency

//calc requests per min 
function getRequests(req, res, next) { //does http tracking
    let requestMethod = req.method.toUpperCase();
    if (requestMethod in requestsByMethod) {
        requestsByMethod[requestMethod] += 1;
    }
    next();
}

//calc active users
//when someone logs in incriment logged in users, when someone logs out decrement. (log outs are delete requests to the auth api)
function incrementActiveUsers(){ //go to auth router where these should be called
    activeUsers +=1
}
function decrementActiveUsers(){
    activeUsers -= 1
}

//calc auth attempts per min and how many succeeded and failed (login and register are only auth attempts, which are put requests to /api/auth)
function incrementSuccessfulAuthAttempts(){
    successfulAuthAttempts += 1
}
function incrementFailedAuthAttempts(){
    failedAuthAttempts += 1
}

//CPU and mem usage
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}
function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

//pizza data
function incrementPizzasMade(pizzasSold, orderPrice){
    pizzasMade += pizzasSold
    totalPrice += orderPrice
}
function incrementFailedPizzas(){
    pizzaCreationFails += 1
}

//calc latency data
function addLatency(latency){ //see example and track in endpoints
    generalLatency += latency
    //latency of Service endpoint
        //how long for response after request to the service endpoint
    //latency of Pizza creation
        //how long for response after purchase request
}
function addPizzaLatency(latency){
    pizzaLatency += latency
}

function sendMetricsPeriodically(period) { //period is oftenness to send, place this code anywhere. grafana can deal with the sum
    setInterval(() => {
      try {
        const buf = Buffer.from([
            `requests_GET ${requestsByMethod.GET}`,
            `requests_POST ${requestsByMethod.POST}`,
            `requests_DELETE ${requestsByMethod.DELETE}`,
            `requests_PUT ${requestsByMethod.PUT}`,
            `active_users ${activeUsers}`,
            `auth_success ${successfulAuthAttempts}`,
            `auth_failed ${failedAuthAttempts}`,
            `cpu_usage ${getCpuUsagePercentage()}`,
            `memory_usage ${getMemoryUsagePercentage()}`,
            `pizzas_sold ${pizzasMade}`,
            `revenue ${totalPrice}`,
            `pizza_fails ${pizzaCreationFails}`,
            `general_latency ${generalLatency}`,
            `pizza_latency ${pizzaLatency}`
        ].join('\n'));
  
        const metrics = buf.toString('\n');
        sendMetricToGrafana(metrics);
      } catch (error) {
        console.log('Error sending metrics', error);
      }
    }, period);
}

function sendMetricToGrafana(metricName, metricValue, type, unit) {
    const metric = {
      resourceMetrics: [
        {
          scopeMetrics: [
            {
              metrics: [
                {
                  name: metricName,
                  unit: unit,
                  [type]: {
                    dataPoints: [
                      {
                        asInt: metricValue,
                        timeUnixNano: Date.now() * 1000000,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  
    if (type === 'sum') {
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].isMonotonic = true;
    }
  
    const body = JSON.stringify(metric);
    fetch(`${config.url}`, {
      method: 'POST',
      body: body,
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => {
            console.error(`Failed to push metrics data to Grafana: ${text}\n${body}`);
          });
        } else {
          console.log(`Pushed ${metricName}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }




module.exports = { 
    getRequests, 
    incrementActiveUsers, 
    decrementActiveUsers, 

    incrementSuccessfulAuthAttempts, 
    incrementFailedAuthAttempts, 

    getCpuUsagePercentage,
    getMemoryUsagePercentage,

    incrementPizzasMade,
    incrementFailedPizzas,

    addLatency,
    addPizzaLatency,

    sendMetricsPeriodically
 }; 