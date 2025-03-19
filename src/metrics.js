const config = require('./config');
const os = require('os');

const requestsByMethod = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
const activeUsers = 0


//required metrics: 
// HTTP requests by method/minute, 
// Active users, 
// Authentication attempts/minute (and how many succeeded or failed), 
// cpu and mem usage, 
// pizza data (sold per min, creation fails, and revenue per min), 
// latency

//calc requests per min //FIXME? should I be calculating per min? Or will sendMetricsPeriodically take care of that?
function getRequests(req, res, next) {
    let requestMethod = req.method.toUpperCase();
    if (requestMethod in requestsByMethod) {
        requestsByMethod[requestMethod] += 1;
    }
    next();
}

//calc active users
//when someone logs in incriment logged in users, when someone logs out decrement. (log outs are delete requests to the auth api)
function getActiveUsers(req, res, next){
    let requestMethod = req.method.toUpperCase();
    //req.
    if (requestMethod == "PUT" && req.path === "/api/auth"){
        if(res.statusCode >= 200 && res.statusCode < 300){
            activeUsers += 1
        }
    }
    else if (requestMethod == "DELETE" && req.path === "/api/auth"){
        if (res.statusCode >= 200 && res.statusCode < 300){
            activeUsers -= 1
        }
    }
    next()
}


//calc auth attempts per min and how many succeeded and failed (login and register are only auth attempts, which are put requests to /api/auth)
function getAuthAttempts(){
    let requestMethod = req.method.toUpperCase();
    let responseCode = 
    //success (we total successes per min)
    //failed (we total fails per min)
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
function getPurchaseMetrics(){
    //how many pizzas made (just increment for each response) (we cal sold per min)
    //how much it cost (sum the prices) (we calc revenue per min)
    //was purchase successful (hmm if we got a 500 no, add that to failed orders) (we will sum creation fails)
}

//calc latency data
function getLatencyData(){
    //latency of Service endpoint
        //how long for response after request to the service endpoint
    //latency of Pizza creation
        //how long for response after purchase request
}

function sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const buf = new MetricBuilder(); //fix all this
        httpMetrics(buf);
        systemMetrics(buf);
        userMetrics(buf);
        purchaseMetrics(buf);
        authMetrics(buf);
  
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




module.exports = { track }; 