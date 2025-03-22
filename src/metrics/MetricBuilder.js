const os = require('os');
const { DB } = require('../database/database.js');

function getCpuUsagePercentage() {
  const isWindows = os.platform() === 'win32';
  if (isWindows) {
    const cpus = os.cpus();
    let idleTime = 0;
    let totalTime = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
      totalTime += cpu.times[type];
      }
      idleTime += cpu.times.idle;
    });

    const idle = idleTime / cpus.length;
    const total = totalTime / cpus.length;
    const usage = ((total - idle) / total) * 100;

    return usage.toFixed(2);
  }
  const cpuUsage = (os.loadavg()[0] / os.cpus().length) * 100;
  return cpuUsage.toFixed(2);
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function getDiskUsagePercentage() {
  const diskUsage = (os.freemem() / os.totalmem()) * 100;
  return diskUsage.toFixed(2);
}

class MetricBuilder {
  static persistentMetrics = {
    http: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      averageResponseTime: 0,
      pizzaCreationTime: 0,
      requestsSinceLastUpdate: 0,
      getRequests: 0,
      postRequests: 0,
      putRequests: 0,
      deleteRequests: 0,
    },
    users: {
      totalUsers: 0,
      activeUsers: {}, // key: userId, value: lastActiveTime
    },
    purchases: {
      totalPurchases: 0,
      successfulPurchases: 0,
      failedPurchases: 0,
      averagePurchaseAmount: 0,
      totalProfits: 0,
    },
    auth: {
      totalRegistrations: 0,
      totalLogins: 0,
      totalLogouts: 0,
      totalAuths: 0,
      successfulAuths: 0,
      failedAuths: 0,
    }
  }
  metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [

            ]
          }
        ]
      }
    ]
  }; // open telemetry standard

  static async initializePersistentMetrics() {
    // initialize totalUsers
    const totalUsers = await DB.getTotalUsers();
    MetricBuilder.persistentMetrics.users.totalUsers = totalUsers;
    // initialize totalProfits and totalPurchases
    const orderStats = await DB.getDinerOrderStats();
    MetricBuilder.persistentMetrics.purchases.totalProfits = orderStats.totalRevenue;
    MetricBuilder.persistentMetrics.purchases.totalPurchases = orderStats.totalOrders;
    MetricBuilder.persistentMetrics.purchases.successfulPurchases = orderStats.totalOrders;
  }

  setMetric(metricName, metricValue, type, unit) {
    const isInt = Number.isInteger(metricValue);
    const metricRecord = {
      name: metricName,
      unit,
      [type]: {
        dataPoints: [
          {
            asInt: isInt ? metricValue : undefined,
            asDouble: isInt ? undefined : metricValue,
            timeUnixNano: Date.now() * 1000000,
          },
        ],
      },
    };
    if (type === 'sum') {
      metricRecord[type].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
      metricRecord[type].isMonotonic = true;
    }
    const matchingRecordIndex = this.metric.resourceMetrics[0].scopeMetrics[0].metrics.findIndex((record) => record.name === metricName);
    if (matchingRecordIndex === -1) {
      this.metric.resourceMetrics[0].scopeMetrics[0].metrics.push(metricRecord);
    } else {
      this.metric.resourceMetrics[0].scopeMetrics[0].metrics[matchingRecordIndex] = metricRecord;
    }
  }

  async httpMetrics(intervalTimeInSeconds) {
    const httpMetricsObj = MetricBuilder.persistentMetrics.http;
    this.setMetric("totalRequests", httpMetricsObj.totalRequests, "sum", "1");
    this.setMetric("successfulRequests", httpMetricsObj.successfulRequests, "sum", "1");
    this.setMetric("failedRequests", httpMetricsObj.failedRequests, "sum", "1");
    this.setMetric("averageResponseTime", httpMetricsObj.averageResponseTime, "gauge", "ms");
    this.setMetric('pizzaCreationTime', httpMetricsObj.pizzaCreationTime, 'gauge', 'ms');
    const requestsPerSecond = httpMetricsObj.requestsSinceLastUpdate / intervalTimeInSeconds;
    httpMetricsObj.requestsSinceLastUpdate = 0;
    this.setMetric("requestsPerSecond", requestsPerSecond, "gauge", "1");
    this.setMetric("getRequests", httpMetricsObj.getRequests, "sum", "1");
    this.setMetric("postRequests", httpMetricsObj.postRequests, "sum", "1");
    this.setMetric("putRequests", httpMetricsObj.putRequests, "sum", "1");
    this.setMetric("deleteRequests", httpMetricsObj.deleteRequests, "sum", "1");
  }
  async systemMetrics() {
    const cpuUsage = getCpuUsagePercentage();
    const memoryUsage = getMemoryUsagePercentage();
    const diskUsage = getDiskUsagePercentage();
    this.setMetric("cpuUsage", cpuUsage, "gauge", "%");
    this.setMetric("memoryUsage", memoryUsage, "gauge", "%");
    this.setMetric("diskUsage", diskUsage, "gauge", "%");
  }
  async userMetrics() {
    const userMetricsObj = MetricBuilder.persistentMetrics.users;
    this.setMetric("totalUsers", userMetricsObj.totalUsers, "gauge", "1");
    // update active users
    const activeTimeout = 1000 * 60 * 5; // 5 minutes
    MetricBuilder.persistentMetrics.users.activeUsers = Object.fromEntries(Object.entries(userMetricsObj.activeUsers).filter((keyValuePair) => {
      return Date.now() - keyValuePair[1] < activeTimeout;
    }));
    this.setMetric("activeUsers", Object.keys(MetricBuilder.persistentMetrics.users.activeUsers).length, "gauge", "1");
  }
  async purchaseMetrics() {
    const purchaseMetricsObj = MetricBuilder.persistentMetrics.purchases;
    this.setMetric("totalPurchases", purchaseMetricsObj.totalPurchases, "sum", "1");
    this.setMetric("successfulPurchases", purchaseMetricsObj.successfulPurchases, "sum", "1");
    this.setMetric("failedPurchases", purchaseMetricsObj.failedPurchases, "sum", "1");
    this.setMetric("averagePurchaseAmount", purchaseMetricsObj.averagePurchaseAmount, "gauge", "$");
    this.setMetric("totalProfits", purchaseMetricsObj.totalProfits, "sum", "$");
  }
  async authMetrics() {
    const authMetricsObj = MetricBuilder.persistentMetrics.auth;
    this.setMetric("totalRegistrations", authMetricsObj.totalRegistrations, "sum", "1");
    this.setMetric("totalLogins", authMetricsObj.totalLogins, "sum", "1");
    this.setMetric("totalLogouts", authMetricsObj.totalLogouts, "sum", "1");
    this.setMetric("totalAuths", authMetricsObj.totalAuths, "sum", "1");
    this.setMetric("successfulAuths", authMetricsObj.successfulAuths, "sum", "1");
    this.setMetric("failedAuths", authMetricsObj.failedAuths, "sum", "1");
  }
  async collectMetrics(intervalTimeInSeconds) {
    this.httpMetrics(intervalTimeInSeconds);
    this.systemMetrics();
    this.userMetrics();
    this.purchaseMetrics();
    this.authMetrics();
    return JSON.stringify(this.metric, null, 2);
  }
}

module.exports = MetricBuilder;