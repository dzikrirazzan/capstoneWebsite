# 📘 EMSys API Documentation

## Base URL

**Production:** `https://capstone-website-snowy.vercel.app/api`  
**Development:** `http://localhost:5000/api`

---

## Endpoints Overview

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/health` | Health check API |
| `POST` | `/api/sensor-data` | Submit data sensor baru |
| `GET` | `/api/sensor-data` | Ambil data sensor dengan paginasi |
| `GET` | `/api/sensor-data/latest` | Ambil data sensor terbaru |
| `GET` | `/api/sensor-data/stats` | Ambil statistik data sensor |
| `GET` | `/api/sensor-data/series` | Ambil data time-series untuk chart |
| `GET` | `/api/sensor-data/export` | Export data ke Excel (.xlsx) |
| `DELETE` | `/api/sensor-data` | Hapus data sensor (by range atau semua) |
| `POST` | `/api/dummy-data` | Generate 50 data dummy untuk testing |
| `DELETE` | `/api/dummy-data` | Hapus semua data dummy |

---

## 1. Health Check

### `GET /api/health`

Cek apakah API berjalan dengan baik.

**Response:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2026-05-15T10:30:00.000Z"
}
```

---

## 2. Submit Sensor Data

### `POST /api/sensor-data`

Kirim data sensor baru dari mesin/perangkat.

**Request Body:**
```json
{
  "timestamp": "2026-05-15T10:30:00.000Z",
  "rpm": 2500,
  "torque": 150.5,
  "maf": 32.8,
  "temperature": 85.3,
  "fuelConsumption": 8.7,
  "customSensor": null,
  "alertStatus": false
}
```

**Required Fields:** `rpm`, `torque`, `maf`, `temperature`, `fuelConsumption`  
**Optional Fields:** `timestamp` (default: `now()`), `customSensor`, `alertStatus` (default: `rpm >= 5000`)

**Response (201):**
```json
{
  "id": 1,
  "timestamp": "2026-05-15T10:30:00.000Z",
  "rpm": 2500,
  "torque": 150.5,
  "maf": 32.8,
  "temperature": 85.3,
  "fuelConsumption": 8.7,
  "customSensor": null,
  "alertStatus": false
}
```

**Error Response (400):**
```json
{
  "error": "Invalid payload",
  "details": "Missing or invalid fields: rpm, temperature"
}
```

---

## 3. Get Sensor Data (with Pagination)

### `GET /api/sensor-data`

Ambil daftar data sensor dengan paginasi.

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | number | `1` | Halaman yang diminta |
| `limit` | number | `100` | Jumlah data per halaman |

**Example:** `GET /api/sensor-data?page=1&limit=20`

**Response:**
```json
{
  "data": [
    {
      "id": 50,
      "timestamp": "2026-05-15T10:30:00.000Z",
      "rpm": 2500,
      "torque": 150.5,
      "maf": 32.8,
      "temperature": 85.3,
      "fuelConsumption": 8.7,
      "customSensor": null,
      "alertStatus": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 4. Get Latest Sensor Data

### `GET /api/sensor-data/latest`

Ambil data sensor terbaru (1 record terakhir).

**Response:**
```json
{
  "id": 50,
  "timestamp": "2026-05-15T10:30:00.000Z",
  "rpm": 2500,
  "torque": 150.5,
  "maf": 32.8,
  "temperature": 85.3,
  "fuelConsumption": 8.7,
  "customSensor": null,
  "alertStatus": false
}
```

**Jika tidak ada data:**
```json
{
  "id": 0,
  "timestamp": "2026-05-15T15:00:00.000Z",
  "rpm": 0,
  "torque": 0,
  "maf": 0,
  "temperature": 0,
  "fuelConsumption": 0,
  "customSensor": null,
  "alertStatus": false
}
```

---

## 5. Get Sensor Statistics

### `GET /api/sensor-data/stats`

Ambil statistik (avg, min, max) dari data sensor.

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `range` | string | `all` | Rentang waktu: `1h`, `24h`, `7d`, `30d`, `all` |
| `start` | ISO 8601 | — | Tanggal mulai custom |
| `end` | ISO 8601 | — | Tanggal akhir custom |

**Example:** `GET /api/sensor-data/stats?range=24h`

**Response:**
```json
{
  "rpm": { "avg": 2450.5, "min": 800, "max": 5200 },
  "torque": { "avg": 145.3, "min": 45.2, "max": 310.8 },
  "temperature": { "avg": 82.1, "min": 68.5, "max": 98.3 },
  "maf": { "avg": 35.2, "min": 8.5, "max": 72.1 },
  "fuelConsumption": { "avg": 8.5, "min": 3.2, "max": 14.8 },
  "count": 150,
  "timeRange": "24h",
  "period": {
    "start": "2026-05-14T10:30:00.000Z",
    "end": "2026-05-15T10:30:00.000Z"
  }
}
```

---

## 6. Get Time Series Data

### `GET /api/sensor-data/series`

Ambil data time-series untuk visualisasi chart.

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `limit` | number | `1000` | Jumlah maksimal data yang dikembalikan |
| `start` | ISO 8601 | — | Tanggal mulai |
| `end` | ISO 8601 | — | Tanggal akhir |

**Example:** `GET /api/sensor-data/series?limit=500&start=2026-05-14T00:00:00Z`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "timestamp": "2026-05-14T00:05:00.000Z",
      "rpm": 850,
      "torque": 45.2,
      "maf": 8.5,
      "temperature": 68.5,
      "fuelConsumption": 3.2,
      "customSensor": null,
      "alertStatus": false
    }
  ]
}
```

---

## 7. Export Data to Excel

### `GET /api/sensor-data/export`

Export data sensor ke file Excel (.xlsx) dengan 3 sheet:
1. **Sensor Data** — Semua data mentah
2. **Summary** — Ringkasan statistik
3. **Charts & Visualization** — Data yang sudah di-sampling untuk chart

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `start` | ISO 8601 | — | Tanggal mulai |
| `end` | ISO 8601 | — | Tanggal akhir |

**Response:** File `.xlsx` (binary download)

**Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Error (404):**
```json
{
  "error": "No data to export"
}
```

---

## 8. Delete Sensor Data

### `DELETE /api/sensor-data`

Hapus data sensor (semua atau berdasarkan rentang waktu).

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `start` | ISO 8601 | — | Tanggal mulai (opsional) |
| `end` | ISO 8601 | — | Tanggal akhir (opsional) |

Jika tidak ada parameter → hapus semua data.

**Response:**
```json
{
  "message": "Deleted 150 records",
  "count": 150
}
```

---

## 9. Deploy Dummy Data

### `POST /api/dummy-data`

Generate 50 data sensor dummy yang realistis untuk testing. Data tersebar selama 24 jam terakhir dengan pola simulasi engine (idle → normal → high load → normal → idle).

**Request Body:** None required

**Response (201):**
```json
{
  "message": "Successfully created 50 dummy data records",
  "count": 50,
  "marker": "customSensor = -999"
}
```

> **Note:** Data dummy ditandai dengan `customSensor = -999` sehingga bisa dihapus secara selektif tanpa mempengaruhi data asli dari mesin.

---

## 10. Remove Dummy Data

### `DELETE /api/dummy-data`

Hapus semua data sensor yang ditandai sebagai dummy (`customSensor = -999`).

**Response:**
```json
{
  "message": "Successfully deleted 50 dummy data records",
  "count": 50
}
```

---

## Data Schema (Prisma)

```prisma
model SensorData {
  id              Int      @id @default(autoincrement())
  timestamp       DateTime @default(now())
  rpm             Float
  torque          Float
  maf             Float    // Mass Air Flow
  temperature     Float
  fuelConsumption Float    @map("fuel_consumption")
  customSensor    Float?   @map("custom_sensor")
  alertStatus     Boolean  @default(false) @map("alert_status")

  @@index([timestamp])
  @@map("sensor_data")
}
```

---

## Error Responses

Semua endpoint mengembalikan error dalam format berikut:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

| Status Code | Deskripsi |
|-------------|-----------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request / Invalid payload |
| `404` | Not found / No data to export |
| `500` | Internal server error |

---

## Architecture

```
Client (Browser/Desktop App)
    │
    ▼
┌────────────────────────┐
│   Vercel Edge Network  │
│  (Static + Serverless) │
├────────────────────────┤
│  Frontend (React/Vite) │  ← Static files (dist/)
│  /api/* → Serverless   │  ← Vercel Functions
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│   PostgreSQL Database  │
│    (via Prisma ORM)    │
└────────────────────────┘
```

**Data Flow:**  
Mesin → Desktop App → `POST /api/sensor-data` → Database → Web Dashboard
