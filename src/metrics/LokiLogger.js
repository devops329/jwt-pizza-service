const config = require('../config');

class LokiLogger {
  static logs = {streams: []};
  static interval = null;
  static intervalTimeInSeconds = 10;
  /**
   * @param {'info'|'warn'|'error'|'debug'} level
   * @param {'http' | 'DB' | 'factory-requests' | 'unhandled-exceptions'} type
   * @param {object} logFields
   */
  static addLogMessage(level, type, logFields = {}) {
    if (Object.keys(logFields).length === 0) {
      return;
    }
    if (!['info', 'warn', 'error', 'debug'].includes(level)) {
      throw new Error('level must be one of: info, warn, error, debug');
    }
    const matchingStreamObj = LokiLogger.logs.streams.find(stream => {
      if (Object.keys(stream.stream).length !== Object.keys(logFields).length) {
        return false;
      }
      for (const key in stream.stream) {
        if (stream.stream[key] !== logFields[key]) {
          return false;
        }
      }
      return true;
    });
    const timestamp = Math.floor(Date.now() / 1000) * 1_000_000_000; // current time in nanoseconds
    const valuePair = [
      String(timestamp),
      JSON.stringify(logFields)
    ];
    if (matchingStreamObj) {
      matchingStreamObj.values.push(valuePair);
      return;
    }
    LokiLogger.logs.streams.push(
      {
        stream: {
          component: config.logs.source,
          level,
          type,
        },
        values: [valuePair]
      }
    );
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
    if (LokiLogger.logs.streams.length === 0) {
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
        body: LokiLogger.sanitize(JSON.stringify(logs)),
      });
      if (!response.ok) {
        const responseBody = await response.text();
        console.error(`Failed to push logs to Loki: ${responseBody}`);
      } else {
        console.log(`Pushed logs to Loki`);
        LokiLogger.logs.streams = [];
      }
    } catch (error) {
      console.error('Error pushing logs to Loki:', error);
    }
  }
  static statusCodeToLevel(statusCode) {
    if (statusCode >= 200 && statusCode < 300) {
      return 'info';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'warn';
    } else if (statusCode >= 500) {
      return 'error';
    }
    return 'debug';
  }
  static async collectHttpLogs(req, res, next) {
    const originalSend = res.send;
    res.send = (resBody) => {
      const statusCode = res.statusCode;
      const logFields = {
        authorized: Boolean(req.headers.authorization),
        path: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: LokiLogger.sanitize(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)),
        resBody: LokiLogger.sanitize(typeof resBody === 'string' ? resBody : JSON.stringify(resBody)),
      }
      const level = LokiLogger.statusCodeToLevel(statusCode);
      LokiLogger.addLogMessage(level, 'http', logFields);
      res.send = originalSend;
      return res.send(resBody);
    };
    next();
  }
  /**
   * 
   * @param {string} reqBody 
   */
  static sanitize(reqBody) {
    return reqBody.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"').replace(/\"password\":\s*\"[^"]*\"/g, '\"password\": \"*****\"');
  }
}

module.exports = LokiLogger;