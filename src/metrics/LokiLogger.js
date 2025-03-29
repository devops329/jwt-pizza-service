const config = require('../config');

class LokiLogger {
  static logs = [];
  static interval = null;
  static intervalTimeInSeconds = 10;
  /**
   * 
   * @param {any[]} logMessages 
   * @param {object} labels 
   */
  static addLogMessage(logMessages, labels) {
    if (!Array.isArray(logMessages)) {
      throw new Error('logMessages must be an array of strings');
    }
    if (typeof labels !== 'object') {
      throw new Error('labels must be an object');
    }
    LokiLogger.logs.push({
      streams: [
        {
          stream: Object.fromEntries(Object.entries(labels).map(([key, value]) => [String(key), String(value)])),
          values: logMessages.map((logMessage) => {
            const timestamp = (Math.floor(Date.now() / 1000) * 1_000_000_000); // current time in nanoseconds
            return [String(timestamp), String(logMessage)];
          })
        }
      ]
    })
  }
  static setIntervalTimeInSeconds(intervalTimeInSeconds) {
    if (typeof intervalTimeInSeconds !== 'number') {
      throw new Error('intervalTimeInSeconds must be a number');
    }
    LokiLogger.intervalTimeInSeconds = intervalTimeInSeconds;
    if (LokiLogger.interval) {
      clearInterval(LokiLogger.interval);
      LokiLogger.startInterval();
    }
  }
  static startInterval() {
    if (!config.logs.url || !config.logs.apiKey) {
      throw new Error('Loki URL or API key is not set in the config file');
    }
    if (LokiLogger.interval) {
      clearInterval(LokiLogger.interval);
    }
    LokiLogger.interval = setInterval(() => {
      LokiLogger.sendLogsToLoki();
    }, LokiLogger.intervalTimeInSeconds * 1000);
  }
  static stopInterval() {
    if (LokiLogger.interval) {
      clearInterval(LokiLogger.interval);
      LokiLogger.interval = null;
    }
  }
  static async sendLogsToLoki() {
    if (LokiLogger.logs.length === 0) {
      return;
    }
    const logs = LokiLogger.logs;
    try {
      const response = await fetch(config.logs.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.logs.apiKey}`
        },
        body: JSON.stringify(logs)
      });
      if (!response.ok) {
        console.error(`Failed to push logs to Loki: ${response.statusText}`);
      } else {
        console.log(`Pushed logs to Loki`);
        LokiLogger.logs = [];
      }
    } catch (error) {
      console.error('Error pushing logs to Loki:', error);
    }
  }
}

module.exports = LokiLogger;