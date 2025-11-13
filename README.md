# EMSys - Engine Monitoring System

Modern real-time vehicle engine monitoring web application built with React, Express.js, and PostgreSQL.

## Overview

EMSys is a comprehensive engine monitoring solution that provides real-time data visualization, analytics, and historical tracking for vehicle performance metrics. The system tracks critical engine parameters including RPM, torque, mass air flow (MAF), temperature, and fuel consumption.

## Features

- **Real-time Monitoring**: Live dashboard displaying current engine metrics
- **Data Analytics**: Advanced health score calculation and fuel efficiency analysis
- **Historical Data**: Comprehensive data logging with filtering and export capabilities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User-customizable interface themes
- **Data Export**: Excel export with detailed statistics and visualizations
- **RESTful API**: Well-documented API for integration with external applications

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Recharts (data visualization)
- React Router

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- ExcelJS (data export)

## Project Structure

```
capstoneWebsite/
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main API handler
│   └── prisma/            # Database schema
├── backend/               # Express.js server (development)
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── db/            # Database client
│   │   └── app.js         # Express app
│   └── prisma/            # Prisma migrations
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   └── App.jsx        # Main app component
│   └── public/            # Static assets
└── README.md
```

## API Documentation

### Endpoints

#### Sensor Data
- `POST /api/sensor-data` - Submit new sensor data
- `GET /api/sensor-data` - Retrieve sensor data with filters
- `GET /api/sensor-data/latest` - Get latest sensor reading
- `GET /api/sensor-data/stats` - Get statistical analysis
- `GET /api/sensor-data/series` - Get time-series data
- `GET /api/sensor-data/export` - Export data to Excel

#### Query Parameters
- `start` - Start date (ISO 8601 format)
- `end` - End date (ISO 8601 format)
- `range` - Predefined time range (1h, 24h, 7d, 30d, all)
- `limit` - Maximum records to return
- `offset` - Pagination offset

### Data Schema

```json
{
  "timestamp": "2025-11-13T10:30:00.000Z",
  "rpm": 2500,
  "torque": 150.5,
  "maf": 32.8,
  "temperature": 85.3,
  "fuelConsumption": 8.7
}
```

## Installation

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- npm or yarn package manager

### Setup

1. Clone the repository
```bash
git clone https://github.com/dzikrirazzan/capstoneWebsite.git
cd capstoneWebsite
```

2. Install dependencies
```bash
npm run install:all
```

3. Configure environment variables

Create `.env` file in the `api` directory:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Create `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
NODE_ENV=development
```

Create `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```

4. Run database migrations
```bash
cd api
npx prisma migrate deploy
npx prisma generate
```

5. Start development servers
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Build for Production
```bash
npm run build
```

## Database Schema

```prisma
model SensorData {
  id               Int      @id @default(autoincrement())
  timestamp        DateTime @default(now())
  rpm              Float
  torque           Float
  maf              Float
  temperature      Float
  fuelConsumption  Float
}
```

## Components Overview

### Dashboard
Main interface displaying real-time sensor data with configurable time ranges.

### Analytics
Advanced analytics page with health score calculation, fuel efficiency metrics, and period comparisons.

### History
Comprehensive data table with filtering, sorting, pagination, and export capabilities.

## Contributing

This is a capstone project. Contributions are currently not accepted.

## License

MIT License

## Author

Developed as part of a capstone project.

---

Last Updated: November 2025
