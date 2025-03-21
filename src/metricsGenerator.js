const config = require('./config.js');
const url = config.grafana.url;
const apiKey = config.grafana.apiKey;

let requests = 0;
let latency = 0;

setInterval(() => {
  const cpuValue = Math.floor(Math.random() * 100) + 1;
  sendMetricToGrafana('cpu', cpuValue, 'gauge', '%');

  requests += Math.floor(Math.random() * 200) + 1;
  sendMetricToGrafana('requests', requests, 'sum', '1');

  latency += Math.floor(Math.random() * 200) + 1;
  sendMetricToGrafana('latency', latency, 'sum', 'ms');
}, 1000);

function sendMetricToGrafana(metricName, metricValue, type, unit) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
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
  fetch(`${url}`, {
    method: 'POST',
    body: body,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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