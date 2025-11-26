import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const sensorDataSuccess = new Counter("sensor_data_success");
const sensorDataFailed = new Counter("sensor_data_failed");
const webRequestSuccess = new Counter("web_request_success");
const webRequestFailed = new Counter("web_request_failed");
const postDuration = new Trend("post_duration");
const getDuration = new Trend("get_duration");

// REALISTIC TEST CONFIGURATION untuk EMSys
// Real use case: 1 Desktop App + website dengan 10-15 users monitoring
export const options = {
  scenarios: {
    // Scenario 1: HIGH FREQUENCY sensor data dari 1 desktop app
    // Mikrokontroller kirim data setiap 1 detik (60 req/min)
    high_frequency_sensors: {
      executor: "constant-arrival-rate",
      rate: 60, // 60 requests per menit = data setiap 1 detik
      timeUnit: "1m",
      duration: "5m",
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: "sensorData",
    },
    // Scenario 2: 10 Web users monitoring dashboard bersamaan
    web_monitoring: {
      executor: "constant-vus",
      vus: 10, // 10 users monitoring
      duration: "5m",
      exec: "webUser",
    },
  },
  thresholds: {
    "http_req_duration{scenario:high_frequency_sensors}": ["p(95)<2000"],
    "http_req_duration{scenario:web_monitoring}": ["p(95)<1500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = "https://capstone-website-snowy.vercel.app";

function generateSensorData() {
  const baseRPM = 1000 + Math.random() * 2000;
  const isHighLoad = Math.random() > 0.7;

  return {
    rpm: Math.floor(baseRPM + (isHighLoad ? 500 : 0)),
    torque: parseFloat((baseRPM / 15 + Math.random() * 20).toFixed(2)),
    maf: parseFloat((baseRPM / 50 + Math.random() * 10).toFixed(1)),
    temperature: parseFloat((75 + (isHighLoad ? 15 : 0) + Math.random() * 10).toFixed(1)),
    fuelConsumption: parseFloat((baseRPM / 300 + Math.random() * 3).toFixed(2)),
  };
}

export function sensorData() {
  const payload = JSON.stringify(generateSensorData());

  const response = http.post(`${BASE_URL}/api/sensor-data`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { scenario: "high_frequency_sensors" },
  });

  const success = check(response, {
    "Sensor POST: status 201": (r) => r.status === 201,
    "Sensor POST: has id": (r) => {
      try {
        return JSON.parse(r.body).id !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  postDuration.add(response.timings.duration);

  if (success) {
    sensorDataSuccess.add(1);
  } else {
    sensorDataFailed.add(1);
  }
}

export function webUser() {
  let response = http.get(`${BASE_URL}/api/sensor-data/latest`, {
    tags: { scenario: "web_monitoring" },
  });

  let success = check(response, {
    "Web latest: status 200": (r) => r.status === 200,
  });

  getDuration.add(response.timings.duration);
  if (success) webRequestSuccess.add(1);
  else webRequestFailed.add(1);

  sleep(3);

  if (Math.random() > 0.7) {
    response = http.get(`${BASE_URL}/api/sensor-data?limit=50`, {
      tags: { scenario: "web_monitoring" },
    });

    success = check(response, {
      "Web history: status 200": (r) => r.status === 200,
    });

    getDuration.add(response.timings.duration);
    if (success) webRequestSuccess.add(1);
    else webRequestFailed.add(1);

    sleep(5);
  }

  sleep(2);
}
