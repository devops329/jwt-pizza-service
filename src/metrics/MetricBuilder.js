const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = (os.loadavg()[0] / os.cpus().length) * 100;
  return Math.round(cpuUsage);
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return Math.round(memoryUsage);
}

function getDiskUsagePercentage() {
  const diskUsage = (os.freemem() / os.totalmem()) * 100;
  return Math.round(diskUsage);
}

class MetricBuilder {
  static persistentMetricsInitialized = false;
  static persistentMetrics = {
    http: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
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

  async initializePersistentMetrics() {
    // initialize totalUsers
  }

  setMetric(metricName, metricValue, type, unit) {
    const metricRecord = {
      name: metricName,
      unit,
      [type]: {
        dataPoints: [
          {
            asInt: metricValue,
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

  async httpMetrics() {
    const httpMetricsObj = MetricBuilder.persistentMetrics.http;
    this.setMetric("totalRequests", httpMetricsObj.totalRequests, "sum", "1");
    this.setMetric("successfulRequests", httpMetricsObj.successfulRequests, "sum", "1");
    this.setMetric("failedRequests", httpMetricsObj.failedRequests, "sum", "1");
    this.setMetric("averageResponseTime", httpMetricsObj.averageResponseTime, "gauge", "ms");
    this.setMetric("requestsPerSecond", httpMetricsObj.requestsPerSecond, "gauge", "1");
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
    MetricBuilder.persistentMetrics.users.activeUsers = Object.fromEntries(Object.entries(userMetricsObj.activeUsers).filter(([_, lastActiveTime]) => {
      return Date.now() - lastActiveTime < activeTimeout;
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
  async collectMetrics() {
    if (MetricBuilder.persistentMetricsInitialized === false) {
      await this.initializePersistentMetrics();
      MetricBuilder.persistentMetricsInitialized = true;
    }
    this.httpMetrics();
    this.systemMetrics();
    this.userMetrics();
    this.purchaseMetrics();
    this.authMetrics();
    return JSON.stringify(this.metric, null, 2);
  }
}

module.exports = MetricBuilder;