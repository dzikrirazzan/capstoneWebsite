import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method, url } = req;
  
  // Parse URL properly
  const path = url.split('?')[0]; // Remove query params

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Health check
    if (path === "/api/health") {
      return res.status(200).json({
        status: "ok",
        message: "API is running",
        timestamp: new Date().toISOString(),
      });
    }

    // Get latest sensor data
    if (path === "/api/sensor-data/latest" || path.startsWith("/api/sensor-data/latest")) {
      const latest = await prisma.sensorData.findFirst({
        orderBy: { timestamp: "desc" },
      });
      
      // Return empty object if no data
      if (!latest) {
        return res.status(200).json({
          id: 0,
          timestamp: new Date().toISOString(),
          rpm: 0,
          torque: 0,
          maf: 0,
          temperature: 0,
          fuelConsumption: 0,
          customSensor: null,
          alertStatus: false
        });
      }
      
      return res.status(200).json(latest);
    }

    // Get stats
    if (path === "/api/sensor-data/stats" || path.startsWith("/api/sensor-data/stats")) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = await prisma.sensorData.findMany({
        where: { timestamp: { gte: oneDayAgo } },
        orderBy: { timestamp: "desc" },
      });

      const stats = {
        rpm: { avg: 0, min: 0, max: 0 },
        torque: { avg: 0, min: 0, max: 0 },
        temperature: { avg: 0, min: 0, max: 0 },
        maf: { avg: 0, min: 0, max: 0 },
        fuelConsumption: { avg: 0, min: 0, max: 0 },
      };

      if (data.length > 0) {
        const keys = ["rpm", "torque", "temperature", "maf", "fuelConsumption"];
        keys.forEach((key) => {
          const values = data.map((d) => d[key]);
          stats[key] = {
            avg: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
            min: Math.min(...values),
            max: Math.max(...values),
          };
        });
      }

      return res.status(200).json(stats);
    }

    // Get time series data
    if (path === "/api/sensor-data/series" || path.startsWith("/api/sensor-data/series")) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = await prisma.sensorData.findMany({
        where: { timestamp: { gte: oneDayAgo } },
        orderBy: { timestamp: "asc" },
        take: 288, // 24 hours * 12 (every 5 min)
      });
      return res.status(200).json(data);
    }

    // Get all sensor data with pagination (must be last)
    if (path === "/api/sensor-data") {
      // Parse query params for pagination
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const limit = parseInt(urlObj.searchParams.get('limit') || '100', 10);
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        prisma.sensorData.findMany({
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: skip,
        }),
        prisma.sensorData.count()
      ]);
      
      return res.status(200).json({
        data: data,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // Not found
    return res.status(404).json({ error: "Not found", path });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
