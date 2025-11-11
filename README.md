# 🚗⚡ FuelSense - Engine Monitoring System<<<<<<< HEAD



Modern real-time vehicle engine monitoring web application with **React** frontend, **Express.js** backend, and **PostgreSQL** database (Supabase).# capstoneWebsite



---=======



## 🌟 Features# 🚗⚡ EMSys - Engine Monitoring System



- ✅ **Real-time Monitoring**: Live RPM, Torque, MAF, Temperature, Fuel ConsumptionModern real-time vehicle engine monitoring web application built with Express.js, React, and MySQL.

- ✅ **Analytics Dashboard**: Health Score, Fuel Efficiency, Data Comparison

- ✅ **Interactive Charts**: Visualize sensor trends with Recharts## 📋 Table of Contents

- ✅ **Historical Data**: PostgreSQL database with 7+ days history

- ✅ **Responsive Design**: Works on desktop, tablet, mobile- [Overview](#overview)

- ✅ **Data Export**: CSV export functionality- [Features](#features)

- ✅ **Modern UI**: Dark theme with TailwindCSS- [Tech Stack](#tech-stack)

- [Project Structure](#project-structure)

---- [Installation](#installation)

- [Configuration](#configuration)

## 🛠️ Tech Stack- [Running the Application](#running-the-application)

- [API Documentation](#api-documentation)

### Backend- [Desktop App Integration](#desktop-app-integration)

- **Express.js** - REST API server- [Screenshots](#screenshots)

- **PostgreSQL** (Supabase) - Database

- **Prisma ORM** - Database access layer## 🌟 Overview

- **serverless-http** - Vercel deployment adapter

EMSys (Engine Monitoring System) is a near real-time monitoring system for vehicle engine parameters. Desktop application (terhubung ke ECU via USB/Serial) mengirim data secara periodik melalui HTTP `POST /api/sensor-data`, kemudian dashboard React mem-polling update terbaru dan menampilkan histori yang tersimpan di MySQL.

### Frontend

- **React 18** + **Vite** - Fast development**Data Flow:**

- **TailwindCSS** - Styling

- **Recharts** - Data visualization```

- **Lucide React** - IconsVehicle ECU → Microcontroller → USB/Serial → Desktop App → HTTP POST → Backend API → Dashboard (Polling)

- **React Router** - Navigation```



### Deployment## ✨ Features

- **Vercel** - Frontend + Backend (Serverless)

- **Supabase** - PostgreSQL Database (Free tier)- ✅ **Near Real-time Monitoring**: Desktop app mengirim data periodik via HTTP

- ✅ **Live Metrics**: Real-time RPM, Torque, MAF, Temperature, Fuel Consumption, and Custom sensor values

---- ✅ **Interactive History Chart**: Visualize sensor trends over selected ranges

- ✅ **Responsive Design**: Works on desktop, tablet, and mobile

## 📋 Quick Start- ✅ **Historical Data**: MySQL database storage

- ✅ **Data Management Tools**: Filter by date, export CSV, and purge outdated records

### 1. Clone Repository- ✅ **REST API**: Query historical data and statistics

```bash- ✅ **Modern UI**: Dark theme with TailwindCSS

git clone https://github.com/dzikrirazzan/capstoneWebsite.git- ✅ **No Authentication**: Single vehicle monitoring (as specified)

cd capstoneWebsite

```## 🛠️ Tech Stack



### 2. Install Dependencies### Backend

```bash

npm install- **Express.js** - REST API server

cd backend && npm install- **MySQL** - Database for historical data

cd ../frontend && npm install- **Prisma ORM** - Database access layer

```- **JavaScript (ESM)** - Runtime implementation

- **serverless-http** - Adapter untuk deploy di Vercel

### 3. Setup Database

See **[SETUP_DATABASE.md](SETUP_DATABASE.md)** for detailed Supabase setup.### Frontend



Quick version:- **React 18** - UI library

```bash- **Vite** - Fast build tool

# Copy env example- **TailwindCSS** - Utility-first CSS

cp backend/.env.example backend/.env- **TailwindCSS components** - Data visualization

- **Lucide React** - Beautiful icons

# Edit backend/.env with your Supabase credentials

# DATABASE_URL=postgresql://...## 📁 Project Structure

# DIRECT_URL=postgresql://...

```

# Run migrationcapstoneWebsite/

cd backend├── backend/

npx prisma migrate dev│   ├── src/

npm run seed  # Optional: Generate sample data│   │   ├── app.js                 # Factory untuk instance Express (serverless & dev)

```│   │   ├── server.js              # HTTP server untuk development lokal

│   │   ├── db/

### 4. Run Development Server│   │   │   └── prisma.ts          # Prisma client

```bash│   │   ├── routes/

# Terminal 1: Backend│   │   │   └── sensorRoutes.js    # REST API endpoints + ingest POST

cd backend│   ├── prisma/

npm run dev│   │   └── schema.prisma          # Database schema

│   ├── package.json

# Terminal 2: Frontend│   └── .env.example

cd frontend│

npm run dev├── frontend/

```│   ├── src/

│   │   ├── App.jsx                # Main app component

Open http://localhost:5173│   │   ├── components/

│   │   │   ├── Dashboard.jsx      # Main dashboard

---│   │   │   ├── Header.jsx         # Header with navigation & theme toggle

│   │   │   ├── StatsPanel.jsx     # Statistics panel

## 🚀 Deployment│   │   │   ├── SensorChart.jsx    # Trend visualization

│   │   │   └── HistoryTable.jsx   # History list

See **[DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)** for complete deployment guide.│   │   └── lib/

│   │       └── utils.js           # Utility functions

### Quick Deploy to Vercel:│   ├── index.html

│   ├── package.json

1. **Push to GitHub** (already done ✅)│   ├── tailwind.config.js

│   └── vite.config.js

2. **Create Supabase Project**│

   - https://supabase.com├── api/index.js                   # Serverless handler untuk Vercel

   - Get connection string from Dashboard├── public/                        # Output statis hasil copy build frontend

├── vercel.json                    # Konfigurasi deploy Vercel (serverless + SPA fallback)

3. **Deploy to Vercel**├── package.json                   # Root package.json (monorepo)

   - https://vercel.com/new└── README.md

   - Import `dzikrirazzan/capstoneWebsite````

   - Add Environment Variables:

     ```## 🚀 Installation

     DATABASE_URL=postgresql://...

     DIRECT_URL=postgresql://...### Prerequisites

     NODE_ENV=production

     ```- **Node.js** 18+ ([Download](https://nodejs.org/))

   - Deploy! 🚀- **MySQL** 8+ ([Download](https://dev.mysql.com/downloads/))

- **npm** or **yarn**

---

### 1. Clone Repository

## 📁 Project Structure

```bash

```cd capstoneWebsite

capstoneWebsite/```

├── backend/

│   ├── src/### 2. Install Dependencies

│   │   ├── app.js              # Express app factory

│   │   ├── server.js           # Development server```bash

│   │   └── routes/# Install root dependencies

│   │       └── sensorRoutes.js # API endpointsnpm install

│   ├── prisma/

│   │   ├── schema.prisma       # PostgreSQL schema# Install backend dependencies

│   │   └── seed.js             # Sample data generatorcd backend && npm install && cd ..

│   └── .env                    # Supabase config

│# Install frontend dependencies

├── frontend/cd frontend && npm install && cd ..

│   ├── src/```

│   │   ├── App.jsx

│   │   ├── components/Or use the shortcut:

│   │   │   ├── dashboard/      # Main dashboard

│   │   │   ├── analytics/      # Analytics page```bash

│   │   │   ├── history/        # Sensor historynpm run install:all

│   │   │   └── Header.jsx      # Navigation```

│   │   └── lib/utils.js

│   └── dist/                   # Build output## ⚙️ Configuration

│

├── api/### 1. Setup MySQL Database

│   └── index.js                # Vercel serverless handler

│Gunakan layanan MySQL favorit kamu (contoh: Docker, MySQL server, XAMPP/MAMP). Contoh membuat database via CLI:

├── vercel.json                 # Vercel configuration

├── SETUP_DATABASE.md           # Database setup guide```bash

└── DEPLOYMENT_VERCEL.md        # Deployment guide# Login to MySQL

```mysql -u root -p



---# Buat database

CREATE DATABASE fuelsense_db;

## 🔌 API Endpoints

# (Opsional) Buat user khusus

### Sensor DataCREATE USER 'fuelsense'@'localhost' IDENTIFIED BY 'passwordku';

- `GET /api/sensors/latest` - Latest sensor readingGRANT ALL PRIVILEGES ON fuelsense_db.* TO 'fuelsense'@'localhost';

- `GET /api/sensors/history` - Historical data (query params: period, limit, startDate, endDate)FLUSH PRIVILEGES;

- `GET /api/sensors/stats` - Statistics (avg, min, max)

- `POST /api/sensor-data` - Ingest new sensor data (from desktop app)# Keluar

- `DELETE /api/sensors/purge` - Delete old recordsEXIT;

```

### Health

- `GET /api/health` - API health check### 2. Configure Backend



---```bash

cd backend

## 📊 Database Schemacp .env.example .env

```

```prisma

model SensorData {Edit `backend/.env`:

  id              Int      @id @default(autoincrement())

  timestamp       DateTime @default(now())```env

  rpm             FloatDATABASE_URL="mysql://username:password@localhost:3306/fuelsense_db"

  torque          FloatPORT=3001

  maf             FloatNODE_ENV=development

  temperature     FloatFRONTEND_URL=http://localhost:5173

  fuelConsumption Float```

  customSensor    Float?

  alertStatus     Boolean  @default(false)### 3. Run Database Migrations

}

``````bash

cd backend

---npm run prisma:migrate

npm run prisma:generate

## 🧪 Sample Data```



Generate sample sensor data:## 🏃 Running the Application

```bash

cd backend### Option 1: Run Both (Recommended)

npm run seed

``````bash

# From root directory

This creates 480 records spanning 7 days with realistic sensor patterns.npm run dev

```

---

This will start:

## 📝 Environment Variables

- Backend on `http://localhost:3001`

### Backend (.env)- Frontend on `http://localhost:5173`

```bash

DATABASE_URL="postgresql://..."      # Supabase connection string### Option 2: Run Separately

DIRECT_URL="postgresql://..."        # Same as DATABASE_URL for Supabase

PORT=3001**Terminal 1 - Backend:**

NODE_ENV=development

FRONTEND_URL=http://localhost:5173```bash

```cd backend

npm run dev

### Vercel (Production)```

```bash

DATABASE_URL="postgresql://..."      # Supabase Transaction Pooler**Terminal 2 - Frontend:**

DIRECT_URL="postgresql://..."        # Same as DATABASE_URL

NODE_ENV=production```bash

```cd frontend

npm run dev

---```



## 🎨 Features Overview### Access the Application



### 1. DashboardOpen your browser and visit: **http://localhost:5173**

- Real-time sensor metrics

- Latest readings display## 📡 API Documentation

- Quick statistics

- Trend visualization### REST API Endpoints



### 2. Analytics#### Health Check

- **Health Score**: 5-sensor analysis (Temp, RPM, Torque, MAF, Fuel)

- **Fuel Efficiency**: Cost calculation (Pertamax RON 92)```http

- **Data Comparison**: Compare different time periodsGET /api/health

```

### 3. Sensor History

- Tabular view of all recordsReturns server status.

- Date filtering

- CSV export#### Get All Sensor Data (Paginated)

- Data purging

```http

---GET /api/sensor-data?page=1&limit=50

```

## 🔧 Development Scripts

**Response:**

### Root

```bash```json

npm run dev                  # Run both backend & frontend{

npm run build:frontend       # Build frontend only  "data": [...],

npm run build:app-platform   # Build frontend + copy to backend/public  "pagination": {

```    "page": 1,

    "limit": 50,

### Backend    "total": 1000,

```bash    "totalPages": 20

npm run dev                  # Development with watch mode  }

npm start                    # Production server}

npm run seed                 # Generate sample data```

npx prisma studio            # Database GUI

npx prisma migrate dev       # Run migrations#### Get Latest Sensor Reading

```

```http

### FrontendGET /api/sensor-data/latest

```bash```

npm run dev                  # Vite dev server

npm run build                # Production build**Response:**

npm run preview              # Preview production build

``````json

{

---  "id": 123,

  "timestamp": "2025-10-16T10:30:00.000Z",

## 📖 Documentation  "rpm": 3500,

  "torque": 250,

- **[SETUP_DATABASE.md](SETUP_DATABASE.md)** - Complete Supabase setup guide  "maf": 85.5,

- **[DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)** - Vercel deployment guide  "temperature": 95.2,

  "fuelConsumption": 8.5,

---  "customSensor": 50.0,

  "alertStatus": false

## 🤝 Contributing}

```

This is a capstone project. Feel free to fork and modify for your own use!

#### Get Statistics

---

```http

## 📄 LicenseGET /api/sensor-data/stats?range=1h

```

MIT

**Query Parameters:**

---

- `range`: `1h`, `24h`, `7d`, `30d`

## 👨‍💻 Author

**Response:**

**Dzikri Razzan**

- GitHub: [@dzikrirazzan](https://github.com/dzikrirazzan)```json

{

---  "rpm": { "min": 800, "max": 6000, "avg": 2500 },

  "torque": { "min": 50, "max": 350, "avg": 180 },

## 🙏 Acknowledgments  "maf": { "min": 10, "max": 120, "avg": 60 },

  "temperature": { "min": 85, "max": 105, "avg": 92 },

- Built with React, Express.js, and Supabase  "fuelConsumption": { "min": 2, "max": 15, "avg": 7 },

- UI components from TailwindCSS  "count": 500,

- Charts powered by Recharts  "timeRange": "1h"

- Icons by Lucide React}

```

---

#### Create Sensor Data (Testing)

**🚀 Ready to deploy? Check [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)!**

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

| Method | Endpoint                  | Deskripsi                                           |
| ------ | ------------------------- | --------------------------------------------------- |
| `POST` | `/api/sensor-data`        | Menyimpan satu record sensor dari desktop app.      |
| `GET`  | `/api/sensor-data/latest` | Di-polling frontend untuk mendeteksi data terbaru.  |
| `GET`  | `/api/health`             | Health check sederhana (dapat dipakai desktop app). |

Contoh payload desktop app:

```json
{
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
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
    FuelConsumption = 7.8
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

> > > > > > > 8f6a11b (proyek capstone)
