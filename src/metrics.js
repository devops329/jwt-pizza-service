const MetricBuilder = require('./metrics/MetricBuilder');
const config = require('./config');

const requestTracker = (req, res, next) => {
  console.log('Request received in requestTracker!');
  next();
}

const responseLogger = (req, res, next) => {
  res.on('finish', () => {
    console.log(`Response status: ${res.statusCode}`);
  });
  next();
};

async function sendMetricToGrafana(metricString) {
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

async function metricInterval() {
  try {
    const buf = new MetricBuilder();
    const metricString = await buf.collectMetrics();
    await sendMetricToGrafana(metricString);
  } catch (error) {
    console.log('Error sending metrics', error);
  }
}

function sendMetricsPeriodically(timeInMilliseconds) {
  setInterval(() => {
    metricInterval();
  }, timeInMilliseconds);
}

module.exports = {
  requestTracker,
  sendMetricsPeriodically,
  responseLogger,
}