const MetricBuilder = require('./metrics/MetricBuilder');
const config = require('./config');

const requestTracker = (req, res, next) => {
  req.requestTime = Date.now();
  next();
}

const responseLogger = (req, res, next) => {
  res.on('finish', () => {
    // handle http metrics
    const statusCode = res.statusCode;
    console.log(`${req.method} ${req.originalUrl} (${statusCode})`);
    if (req.method == "GET") {
      MetricBuilder.persistentMetrics.http.totalRequests++;
      MetricBuilder.persistentMetrics.http.getRequests++;
    } else if (req.method == "POST") {
      MetricBuilder.persistentMetrics.http.totalRequests++;
      MetricBuilder.persistentMetrics.http.postRequests++;
    } else if (req.method == "PUT") {
      MetricBuilder.persistentMetrics.http.totalRequests++;
      MetricBuilder.persistentMetrics.http.putRequests++;
    } else if (req.method == "DELETE") {
      MetricBuilder.persistentMetrics.http.totalRequests++;
      MetricBuilder.persistentMetrics.http.deleteRequests++;
    } else {
      next();
      return;
    }
    MetricBuilder.persistentMetrics.http.requestsSinceLastUpdate++;
    if (statusCode >= 200 && statusCode < 300) {
      MetricBuilder.persistentMetrics.http.successfulRequests++;
    } else {
      MetricBuilder.persistentMetrics.http.failedRequests++;
    }
    const responseTimes = MetricBuilder.persistentMetrics.http.responseTimes;
    if (responseTimes.length > 32) {
      responseTimes.shift();
    }
    responseTimes.push(Date.now() - req.requestTime);
    MetricBuilder.persistentMetrics.http.averageResponseTime = Math.round(responseTimes.reduce((total, time) => total + time, 0) / responseTimes.length);
    // handle auth metrics
    const userInfo = req.user;
    if (userInfo) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        MetricBuilder.persistentMetrics.users.activeUsers[token] = Date.now();
      }
    }
    if (req.originalUrl.includes('/api/auth/') && req.method == "POST") {
      MetricBuilder.persistentMetrics.auth.totalRegistrations++;
      MetricBuilder.persistentMetrics.auth.totalAuths++;
      if (statusCode >= 200 && statusCode < 300) {
        MetricBuilder.persistentMetrics.auth.successfulAuths++;
      } else {
        MetricBuilder.persistentMetrics.auth.failedAuths++;
      }
    } else if (req.originalUrl.includes('/api/auth') && req.method == "PUT") {
      MetricBuilder.persistentMetrics.auth.totalLogins++;
      MetricBuilder.persistentMetrics.auth.totalAuths++;
      if (statusCode >= 200 && statusCode < 300) {
        MetricBuilder.persistentMetrics.auth.successfulAuths++;
      } else {
        MetricBuilder.persistentMetrics.auth.failedAuths++;
      }
    } else if (req.originalUrl.includes('/api/auth') && req.method == "DELETE") {
      MetricBuilder.persistentMetrics.auth.totalLogouts++;
      MetricBuilder.persistentMetrics.auth.totalAuths++;
      if (statusCode >= 200 && statusCode < 300) {
        MetricBuilder.persistentMetrics.auth.successfulAuths++;
      } else {
        MetricBuilder.persistentMetrics.auth.failedAuths++;
      }
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        delete MetricBuilder.persistentMetrics.users.activeUsers[token];
      }
    }
    // handle profit metrics
    if (req.originalUrl.includes('/api/order') && req.method == "POST") {
      const pizzaCreationTime = Date.now() - req.requestTime;
      MetricBuilder.persistentMetrics.http.pizzaCreationTime = pizzaCreationTime;
      MetricBuilder.persistentMetrics.purchases.totalPurchases++;
      if (statusCode >= 200 && statusCode < 300) {
        MetricBuilder.persistentMetrics.purchases.successfulPurchases++;
        const items = req.body.items;
        const purchaseAmount = items.reduce((total, item) => total + item.price, 0);
        MetricBuilder.persistentMetrics.purchases.totalProfits += purchaseAmount;
        const totalPurchaseAmounts = MetricBuilder.persistentMetrics.purchases.successfulPurchases * MetricBuilder.persistentMetrics.purchases.averagePurchaseAmount;
        MetricBuilder.persistentMetrics.purchases.averagePurchaseAmount = (totalPurchaseAmounts + purchaseAmount) / MetricBuilder.persistentMetrics.purchases.successfulPurchases;

      } else {
        MetricBuilder.persistentMetrics.purchases.failedPurchases++;
      }
    }
  });
  next();
};

async function sendMetricToGrafana(metricString) {
  console.log(`Metric values:\n${JSON.parse(metricString).resourceMetrics[0].scopeMetrics[0].metrics.map((metric) => {
    const dataPoints = Object.values(metric).find((val) => typeof val == 'object' && 'dataPoints' in val).dataPoints;
    return `  ${metric.name}: ${dataPoints[0].asInt || dataPoints[0].asDouble || 0}`;
    }).join('\n')}`);
  fetch(`${config.grafana.url}`, {
    method: 'POST',
    body: metricString,
    headers: { Authorization: `Bearer ${config.grafana.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(`Failed to push metrics data to Grafana: ${text}\n${metricString}`);
        });
      } else {
        console.log(`Pushed metrics`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

async function metricInterval(intervalTimeInSeconds) {
  try {
    const buf = new MetricBuilder();
    const metricString = await buf.collectMetrics(intervalTimeInSeconds);
    await sendMetricToGrafana(metricString);
  } catch (error) {
    console.log('Error sending metrics', error);
  }
}

function sendMetricsPeriodically(timeInMilliseconds) {
  MetricBuilder.initializePersistentMetrics().then(() => {
    setInterval(() => {
      metricInterval(timeInMilliseconds / 1000);
    }, timeInMilliseconds);
  });
}

module.exports = {
  requestTracker,
  sendMetricsPeriodically,
  responseLogger,
}