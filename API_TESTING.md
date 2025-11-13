# FuelSense Monitor - API Testing Guide

Panduan lengkap untuk testing API menggunakan Postman Collection.

## 📥 Import Postman Collection

1. Buka Postman
2. Klik **Import** di pojok kiri atas
3. Pilih file `FuelSense_API.postman_collection.json`
4. Collection akan muncul di sidebar kiri

## 🔧 Setup Environment

Collection ini sudah include environment variable:

- **base_url**: `http://localhost:5000` (default untuk local development)
- **production_url**: `https://your-production-url.vercel.app` (disabled, aktifkan saat deploy)

### Cara Ganti URL:

**Untuk Local Testing:**

- Tidak perlu ubah apa-apa, sudah default ke `http://localhost:5000`

**Untuk Production Testing:**

1. Klik pada collection "FuelSense Monitor API"
2. Tab **Variables**
3. Disable `base_url`
4. Enable `production_url` dan ganti valuenya dengan URL production Anda
5. Save

## 📋 Available Endpoints

### 1. Sensor Data

#### ➕ Create Sensor Data

- **POST** `/api/sensor-data`
- Body (JSON):

```json
{
  "rpm": 3500,
  "torque": 85.5,
  "maf": 2500,
  "temperature": 92.5,
  "fuelConsumption": 12.8,
  "customSensor": 100, // optional
  "alertStatus": false // optional
}
```

#### ➕ Create with Custom Timestamp

- **POST** `/api/sensor-data`
- Body dengan timestamp spesifik:

```json
{
  "timestamp": "2025-11-12T10:30:00.000Z",
  "rpm": 4200,
  "torque": 95.3,
  "maf": 3000,
  "temperature": 98.2,
  "fuelConsumption": 15.5
}
```

#### 📊 Get All Sensor Data

- **GET** `/api/sensor-data`
- Query params (optional):
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `start`: Start date (ISO 8601)
  - `end`: End date (ISO 8601)

**Contoh:**

```
GET /api/sensor-data?page=1&limit=10
GET /api/sensor-data?start=2025-11-01T00:00:00.000Z&end=2025-11-12T23:59:59.999Z
```

#### 🔍 Get Latest Reading

- **GET** `/api/sensor-data/latest`
- Returns: Data sensor terbaru

#### 📈 Get Sensor Data Series

- **GET** `/api/sensor-data/series`
- Query params (optional):
  - `limit`: Max records (default: 200, max: 1000)
  - `start`: Start date
  - `end`: End date

**Untuk charting:**

```
GET /api/sensor-data/series?limit=500
GET /api/sensor-data/series?start=2025-11-12T00:00:00.000Z&limit=1000
```

### 2. Statistics

#### 📊 Get Statistics

- **GET** `/api/sensor-data/stats`
- Query params:
  - `range`: Time range (`1h`, `24h`, `7d`, `30d`)
  - OR `start` & `end` untuk custom range

**Contoh:**

```
GET /api/sensor-data/stats?range=1h          // Last 1 hour
GET /api/sensor-data/stats?range=24h         // Last 24 hours
GET /api/sensor-data/stats?range=7d          // Last 7 days
GET /api/sensor-data/stats?range=30d         // Last 30 days
GET /api/sensor-data/stats?start=2025-11-01T00:00:00.000Z&end=2025-11-12T23:59:59.999Z
```

**Response:**

```json
{
  "rpm": { "min": 800, "max": 5500, "avg": 3200 },
  "torque": { "min": 20.5, "max": 110.2, "avg": 75.8 },
  "maf": { "min": 500, "max": 4500, "avg": 2800 },
  "temperature": { "min": 85.2, "max": 105.8, "avg": 95.5 },
  "fuelConsumption": { "min": 5.2, "max": 22.5, "avg": 14.3 },
  "count": 1234,
  "timeRange": "24h",
  "period": {
    "start": "2025-11-11T10:30:00.000Z",
    "end": "2025-11-12T10:30:00.000Z"
  }
}
```

### 3. Export

#### 📥 Export to Excel

- **GET** `/api/sensor-data/export`
- Query params (optional):
  - `start`: Start date
  - `end`: End date

**Contoh:**

```
GET /api/sensor-data/export                                    // Export all
GET /api/sensor-data/export?start=2025-11-01&end=2025-11-12   // Export range
```

**File yang di-download:**

- Format: `.xlsx` (Excel)
- 3 sheets:
  1. **Sensor Data** - Raw data lengkap
  2. **Summary** - Statistik & metadata
  3. **Charts & Visualization** - Data untuk plotting

### 4. Delete

⚠️ **HATI-HATI**: Operasi ini permanent!

#### 🗑️ Delete All Data

- **DELETE** `/api/sensor-data`

#### 🗑️ Delete by Date Range

- **DELETE** `/api/sensor-data?start=...&end=...`

**Contoh:**

```
DELETE /api/sensor-data?start=2025-11-01T00:00:00.000Z&end=2025-11-01T23:59:59.999Z
```

## 🧪 Testing Workflow

### Basic Testing Flow:

1. **Check Health**

   ```
   GET /api
   ```

2. **Create Test Data**

   ```
   POST /api/sensor-data
   (gunakan request "Create Sensor Data")
   ```

3. **Verify Data Created**

   ```
   GET /api/sensor-data/latest
   ```

4. **Get Statistics**

   ```
   GET /api/sensor-data/stats?range=1h
   ```

5. **Export to Excel** (optional)
   ```
   GET /api/sensor-data/export
   ```

### Advanced Testing:

1. **Create Multiple Records** - Run POST request beberapa kali dengan data berbeda

2. **Test Pagination**

   ```
   GET /api/sensor-data?page=1&limit=5
   GET /api/sensor-data?page=2&limit=5
   ```

3. **Test Date Filtering**

   ```
   GET /api/sensor-data?start=2025-11-12T00:00:00.000Z&end=2025-11-12T23:59:59.999Z
   ```

4. **Test Alert Status** - Create data dengan RPM >= 5000

   ```json
   {
     "rpm": 5500,
     "torque": 110.2,
     "maf": 4500,
     "temperature": 105.8,
     "fuelConsumption": 22.5
   }
   ```

5. **Test Statistics Ranges**
   - Last 1 hour: `?range=1h`
   - Last 24 hours: `?range=24h`
   - Last 7 days: `?range=7d`
   - Last 30 days: `?range=30d`
   - Custom: `?start=...&end=...`

## 📝 Notes

### Required Fields untuk POST:

- `rpm` (number)
- `torque` (number)
- `maf` (number)
- `temperature` (number)
- `fuelConsumption` (number)

### Optional Fields:

- `timestamp` (ISO 8601 string) - default: current time
- `customSensor` (number) - default: null
- `alertStatus` (boolean) - default: auto (true if RPM >= 5000)

### Date Format:

Gunakan ISO 8601 format:

```
2025-11-12T10:30:00.000Z
```

### Response Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid data)
- `404` - Not Found
- `500` - Server Error

## 🚀 Quick Start

1. **Pastikan backend running:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Import collection ke Postman**

3. **Test basic endpoint:**

   - Run "API Health Check"
   - Run "Create Sensor Data"
   - Run "Get Latest Sensor Reading"

4. **Done!** 🎉

## 🔗 WebSocket Testing

Untuk testing WebSocket (real-time data), gunakan tools seperti:

- **Postman WebSocket** (available in Postman v10+)
- **wscat** CLI tool
- **Frontend application** (recommended)

WebSocket endpoint:

```
ws://localhost:5000
```

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Express.js Guide](https://expressjs.com/)
- [Socket.io Docs](https://socket.io/docs/)

---

**Happy Testing!** 🚀
