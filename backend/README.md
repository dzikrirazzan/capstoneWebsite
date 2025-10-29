# FuelSense Backend API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your MySQL database:

```bash
cp .env.example .env
```

3. Run database migrations:

```bash
npm run prisma:migrate
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Start development server:

```bash
npm run dev
```

## API Endpoints

### REST API

- `GET /api/health` - Health check
- `GET /api/sensor-data` - Get all sensor data (with pagination)
- `GET /api/sensor-data/latest` - Get latest sensor reading
- `GET /api/sensor-data/stats` - Get statistics (min, max, avg)
- `POST /api/sensor-data` - Create sensor data (for testing)

### WebSocket Events

**From Desktop App → Server:**

- `sensor:data` - Send new sensor reading

**From Server → Frontend:**

- `sensor:update` - Broadcast sensor data to all connected clients
- `sensor:alert` - Send alert notification

## Database Schema

See `prisma/schema.prisma` for the complete database schema.
