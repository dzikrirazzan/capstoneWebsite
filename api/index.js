import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method, url } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'ok',
        message: 'API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Get latest sensor data
    if (url === '/api/sensor-data/latest' || url.startsWith('/api/sensor-data/latest')) {
      const latest = await prisma.sensorData.findFirst({
        orderBy: { timestamp: 'desc' }
      });
      return res.status(200).json(latest);
    }

    // Get all sensor data (with pagination)
    if (url === '/api/sensor-data' || url.startsWith('/api/sensor-data?')) {
      const data = await prisma.sensorData.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      return res.status(200).json(data);
    }

    // Get stats
    if (url === '/api/sensor-data/stats') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = await prisma.sensorData.findMany({
        where: { timestamp: { gte: oneDayAgo } },
        orderBy: { timestamp: 'desc' }
      });

      const stats = {
        rpm: { avg: 0, min: 0, max: 0 },
        torque: { avg: 0, min: 0, max: 0 },
        temperature: { avg: 0, min: 0, max: 0 },
        maf: { avg: 0, min: 0, max: 0 },
        fuelConsumption: { avg: 0, min: 0, max: 0 }
      };

      if (data.length > 0) {
        const keys = ['rpm', 'torque', 'temperature', 'maf', 'fuelConsumption'];
        keys.forEach(key => {
          const values = data.map(d => d[key]);
          stats[key] = {
            avg: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
            min: Math.min(...values),
            max: Math.max(...values)
          };
        });
      }

      return res.status(200).json(stats);
    }

    // Get time series data
    if (url === '/api/sensor-data/series' || url.startsWith('/api/sensor-data/series')) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = await prisma.sensorData.findMany({
        where: { timestamp: { gte: oneDayAgo } },
        orderBy: { timestamp: 'asc' },
        take: 288 // 24 hours * 12 (every 5 min)
      });
      return res.status(200).json(data);
    }

    // Not found
    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}

