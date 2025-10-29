<<<<<<< HEAD
# capstoneWebsite
=======
# 🚗⚡ FuelSense Monitor - Web Application

Modern real-time vehicle engine monitoring web application built with Express.js, React, and MySQL.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Desktop App Integration](#desktop-app-integration)
- [Screenshots](#screenshots)

## 🌟 Overview

FuelSense Monitor Web App is a near real-time monitoring system for vehicle engine parameters. Desktop application (terhubung ke ECU via USB/Serial) mengirim data secara periodik melalui HTTP `POST /api/sensor-data`, kemudian dashboard React mem-polling update terbaru dan menampilkan histori yang tersimpan di MySQL.

**Data Flow:**

```
Vehicle ECU → Microcontroller → USB/Serial → Desktop App → HTTP POST → Backend API → Dashboard (Polling)
```

## ✨ Features

- ✅ **Near Real-time Monitoring**: Desktop app mengirim data periodik via HTTP
- ✅ **Live Metrics**: Real-time RPM, Torque, MAF, Temperature, Fuel Consumption, and Custom sensor values
- ✅ **Interactive History Chart**: Visualize sensor trends over selected ranges
- ✅ **Alert System**: Automatic alerts when RPM ≥ 5000
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Historical Data**: MySQL database storage
- ✅ **Data Management Tools**: Filter by date, export CSV, and purge outdated records
- ✅ **REST API**: Query historical data and statistics
- ✅ **Modern UI**: Dark theme with TailwindCSS
- ✅ **No Authentication**: Single vehicle monitoring (as specified)

## 🛠️ Tech Stack

### Backend

- **Express.js** - REST API server
- **MySQL** - Database for historical data
- **Prisma ORM** - Database access layer
- **JavaScript (ESM)** - Runtime implementation
- **serverless-http** - Adapter untuk deploy di Vercel

### Frontend

- **React 18** - UI library
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **TailwindCSS components** - Data visualization
- **Lucide React** - Beautiful icons

## 📁 Project Structure

```
capstoneWebsite/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Factory untuk instance Express (serverless & dev)
│   │   ├── server.js              # HTTP server untuk development lokal
│   │   ├── db/
│   │   │   └── prisma.ts          # Prisma client
│   │   ├── routes/
│   │   │   └── sensorRoutes.js    # REST API endpoints + ingest POST
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app component
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── Header.jsx         # Header with navigation & status
│   │   │   ├── AlertBanner.jsx    # Alert notification
│   │   │   ├── StatsPanel.jsx     # Statistics panel
│   │   │   ├── SensorChart.jsx    # Trend visualization
│   │   │   └── HistoryTable.jsx   # History list
│   │   └── lib/
│   │       └── utils.js           # Utility functions
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── api/index.js                   # Serverless handler untuk Vercel
├── public/                        # Output statis hasil copy build frontend
├── vercel.json                    # Konfigurasi deploy Vercel (serverless + SPA fallback)
├── package.json                   # Root package.json (monorepo)
└── README.md
```

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8+ ([Download](https://dev.mysql.com/downloads/))
- **npm** or **yarn**

### 1. Clone Repository

```bash
cd capstoneWebsite
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

Or use the shortcut:

```bash
npm run install:all
```

## ⚙️ Configuration

### 1. Setup MySQL Database

Gunakan layanan MySQL favorit kamu (contoh: Docker, MySQL server, XAMPP/MAMP). Contoh membuat database via CLI:

```bash
# Login to MySQL
mysql -u root -p

# Buat database
CREATE DATABASE fuelsense_db;

# (Opsional) Buat user khusus
CREATE USER 'fuelsense'@'localhost' IDENTIFIED BY 'passwordku';
GRANT ALL PRIVILEGES ON fuelsense_db.* TO 'fuelsense'@'localhost';
FLUSH PRIVILEGES;

# Keluar
EXIT;
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/fuelsense_db"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

## 🏃 Running the Application

### Option 1: Run Both (Recommended)

```bash
# From root directory
npm run dev
```

This will start:

- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`

### Option 2: Run Separately

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Access the Application

Open your browser and visit: **http://localhost:5173**

## 📡 API Documentation

### REST API Endpoints

#### Health Check

```http
GET /api/health
```

Returns server status.

#### Get All Sensor Data (Paginated)

```http
GET /api/sensor-data?page=1&limit=50
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

#### Get Latest Sensor Reading

```http
GET /api/sensor-data/latest
```

**Response:**

```json
{
  "id": 123,
  "timestamp": "2025-10-16T10:30:00.000Z",
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
  "alertStatus": false
}
```

#### Get Statistics

```http
GET /api/sensor-data/stats?range=1h
```

**Query Parameters:**

- `range`: `1h`, `24h`, `7d`, `30d`

**Response:**

```json
{
  "rpm": { "min": 800, "max": 6000, "avg": 2500 },
  "torque": { "min": 50, "max": 350, "avg": 180 },
  "maf": { "min": 10, "max": 120, "avg": 60 },
  "temperature": { "min": 85, "max": 105, "avg": 92 },
  "fuelConsumption": { "min": 2, "max": 15, "avg": 7 },
  "count": 500,
  "timeRange": "1h"
}
```

#### Create Sensor Data (Testing)

```http
POST /api/sensor-data
Content-Type: application/json

{
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
  "alertStatus": false
}
```

### Desktop HTTP Endpoints

| Method | Endpoint | Deskripsi |
| ------ | -------- | --------- |
| `POST` | `/api/sensor-data` | Menyimpan satu record sensor dari desktop app. |
| `GET`  | `/api/sensor-data/latest` | Di-polling frontend untuk mendeteksi data terbaru. |
| `GET`  | `/api/health` | Health check sederhana (dapat dipakai desktop app). |

Contoh payload desktop app:

```json
{
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
  "alertStatus": false,
  "timestamp": "2024-06-01T12:00:00Z"
}
```

## 🔌 Desktop App Integration

Integrasi terbaru menggunakan HTTP REST. Lihat panduan lengkap di [`DESKTOP_INTEGRATION.md`](DESKTOP_INTEGRATION.md) bagian **2024 Update: HTTP REST Ingestion**. Contoh singkat:

```csharp
var service = new SensorApiService("https://<domain>/");
await service.SendReadingAsync(new SensorData {
    Rpm = 3200,
    Torque = 210,
    Maf = 75.2,
    Temperature = 92.4,
    FuelConsumption = 7.8,
    AlertStatus = false
});
```

Service menangani `POST /api/sensor-data`, sementara frontend mem-polling data terbaru otomatis.

## 📱 Testing

### Test Dashboard (Manual)

1. Buka `http://localhost:5173`.
2. Pastikan backend (`npm run dev:backend`) sedang berjalan dan database terkoneksi.
3. Klik tombol **"Kirim Data Uji"** pada header.
4. Dashboard akan memperbarui kartu statistik dan grafik setelah interval polling (maks 5 detik).

### Test with curl

```bash
# Health check
curl http://localhost:3001/api/health

# Get latest data
curl http://localhost:3001/api/sensor-data/latest

# Post test data
curl -X POST http://localhost:3001/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "rpm": 4500,
    "torque": 280,
    "maf": 92.3,
    "temperature": 98.5,
    "fuelConsumption": 9.2,
    "customSensor": 65.0
  }'
```

## 🎨 UI Features

- **Responsive Design**: Adapts to mobile, tablet, desktop
- **Real-time Feed**: Live metrics update instantly on the dashboard
- **Interactive Chart**: Tampilan tren multi-metrik secara langsung
- **Advanced Filters**: Date range, pagination, dan manajemen data dalam satu panel
- **Alert System**: Visual dan animasi peringatan saat RPM tinggi
- **Clean Dark Theme**: Konsisten dengan aksen lembut untuk kenyamanan malam hari

## 🔧 Troubleshooting

### Backend won't start

- Pastikan layanan MySQL aktif (`mysqladmin ping` atau cek di XAMPP)
- Verifikasi `.env` `DATABASE_URL` sudah benar
- Jalankan ulang: `npm run prisma:generate`

### Frontend won't connect

- Check backend is running on port 3001
- Verify CORS settings in `backend/src/server.ts`
- Check browser console for errors

### Database errors

- Pastikan database sudah dibuat: `mysql -u root -p -e "CREATE DATABASE fuelsense_db"`
- Jalankan migrasi: `cd backend && npm run prisma:migrate`

## 📄 License

MIT License

## 👥 Contributors

- Your Name (Full-stack Development)

---

**Built with ❤️ for Real-time Vehicle Monitoring**
>>>>>>> 8f6a11b (proyek capstone)
