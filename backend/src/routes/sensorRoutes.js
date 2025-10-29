import { Router } from "express";
import prisma from "../db/prisma.js";

const router = Router();

const normalizeQueryValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const parseDate = (value) => {
  const normalized = normalizeQueryValue(value);
  if (!normalized || typeof normalized !== "string") {
    return undefined;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseIntQuery = (value, fallback) => {
  const normalized = normalizeQueryValue(value);
  const parsed = Number.parseInt(normalized ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildTimestampFilter = (startDate, endDate) => {
  const timestampFilter = {};
  if (startDate) timestampFilter.gte = startDate;
  if (endDate) timestampFilter.lte = endDate;
  return Object.keys(timestampFilter).length > 0 ? { timestamp: timestampFilter } : undefined;
};

const parseNumeric = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const parseTimestamp = (value) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// Create new sensor data entry (HTTP ingest)
router.post("/sensor-data", async (req, res) => {
  try {
    const {
      timestamp,
      rpm,
      torque,
      maf,
      temperature,
      fuelConsumption,
      customSensor,
      alertStatus,
    } = req.body ?? {};

    const parsed = {
      rpm: parseNumeric(rpm),
      torque: parseNumeric(torque),
      maf: parseNumeric(maf),
      temperature: parseNumeric(temperature),
      fuelConsumption: parseNumeric(fuelConsumption),
      customSensor: parseNumeric(customSensor),
    };

    const requiredKeys = ["rpm", "torque", "maf", "temperature", "fuelConsumption"];
    const missing = requiredKeys.filter((key) => typeof parsed[key] !== "number");

    if (missing.length) {
      return res.status(400).json({
        error: "Invalid payload",
        details: `Missing or invalid fields: ${missing.join(", ")}`,
      });
    }

    const parsedTimestamp = parseTimestamp(timestamp);
    if (timestamp && !parsedTimestamp) {
      return res.status(400).json({ error: "Invalid timestamp value" });
    }

    const data = {
      rpm: parsed.rpm,
      torque: parsed.torque,
      maf: parsed.maf,
      temperature: parsed.temperature,
      fuelConsumption: parsed.fuelConsumption,
      customSensor: typeof parsed.customSensor === "number" ? parsed.customSensor : null,
      alertStatus: typeof alertStatus === "boolean" ? alertStatus : parsed.rpm >= 5000,
    };

    if (parsedTimestamp) {
      data.timestamp = parsedTimestamp;
    }

    const savedData = await prisma.sensorData.create({ data });

    res.status(201).json(savedData);
  } catch (error) {
    console.error("Error saving sensor data:", error);
    res.status(500).json({ error: "Failed to save sensor data" });
  }
});

// Get all sensor data with pagination
router.get("/sensor-data", async (req, res) => {
  try {
    const page = Math.max(parseIntQuery(req.query.page, 1), 1);
    const limit = Math.max(parseIntQuery(req.query.limit, 50), 1);
    const skip = (page - 1) * limit;
    const startDate = parseDate(req.query.start);
    const endDate = parseDate(req.query.end);

    const where = buildTimestampFilter(startDate, endDate);

    const [data, total] = await Promise.all([
      prisma.sensorData.findMany({
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        where,
      }),
      prisma.sensorData.count({ where }),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ error: "Failed to fetch sensor data" });
  }
});

// Get latest sensor reading
router.get("/sensor-data/latest", async (req, res) => {
  try {
    const latest = await prisma.sensorData.findFirst({
      orderBy: { timestamp: "desc" },
    });

    if (!latest) {
      return res.status(404).json({ error: "No data available" });
    }

    res.json(latest);
  } catch (error) {
    console.error("Error fetching latest sensor data:", error);
    res.status(500).json({ error: "Failed to fetch latest sensor data" });
  }
});

// Get statistics (min, max, avg)
router.get("/sensor-data/stats", async (req, res) => {
  try {
    const rangeOverrideStart = parseDate(req.query.start);
    const rangeOverrideEnd = parseDate(req.query.end);

    let startTime = rangeOverrideStart;
    let endTime = rangeOverrideEnd;
    let timeRange = normalizeQueryValue(req.query.range) || "1h"; // 1h, 24h, 7d, 30d

    if (!startTime && !endTime) {
      startTime = new Date();
      switch (timeRange) {
        case "1h":
          startTime.setHours(startTime.getHours() - 1);
          break;
        case "24h":
          startTime.setHours(startTime.getHours() - 24);
          break;
        case "7d":
          startTime.setDate(startTime.getDate() - 7);
          break;
        case "30d":
          startTime.setDate(startTime.getDate() - 30);
          break;
        default:
          timeRange = "custom";
          break;
      }
    } else {
      timeRange = "custom";
    }

    const data = await prisma.sensorData.findMany({
      where: buildTimestampFilter(startTime, endTime),
    });

    if (data.length === 0) {
      return res.json({
        rpm: { min: 0, max: 0, avg: 0 },
        torque: { min: 0, max: 0, avg: 0 },
        maf: { min: 0, max: 0, avg: 0 },
        temperature: { min: 0, max: 0, avg: 0 },
        fuelConsumption: { min: 0, max: 0, avg: 0 },
        count: 0,
        timeRange,
      });
    }

    const getFieldValues = (field) => data.map((record) => record[field]);
    const average = (field) => getFieldValues(field).reduce((sum, value) => sum + value, 0) / data.length;

    const stats = {
      rpm: {
        min: Math.min(...getFieldValues("rpm")),
        max: Math.max(...getFieldValues("rpm")),
        avg: average("rpm"),
      },
      torque: {
        min: Math.min(...getFieldValues("torque")),
        max: Math.max(...getFieldValues("torque")),
        avg: average("torque"),
      },
      maf: {
        min: Math.min(...getFieldValues("maf")),
        max: Math.max(...getFieldValues("maf")),
        avg: average("maf"),
      },
      temperature: {
        min: Math.min(...getFieldValues("temperature")),
        max: Math.max(...getFieldValues("temperature")),
        avg: average("temperature"),
      },
      fuelConsumption: {
        min: Math.min(...getFieldValues("fuelConsumption")),
        max: Math.max(...getFieldValues("fuelConsumption")),
        avg: average("fuelConsumption"),
      },
      count: data.length,
      timeRange,
      period: {
        start: startTime ?? null,
        end: endTime ?? null,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error calculating statistics:", error);
    res.status(500).json({ error: "Failed to calculate statistics" });
  }
});

// Get sensor data series for charting
router.get("/sensor-data/series", async (req, res) => {
  try {
    const startDate = parseDate(req.query.start);
    const endDate = parseDate(req.query.end);
    const limit = Math.min(parseIntQuery(req.query.limit, 200), 1000);

    const data = await prisma.sensorData.findMany({
      where: buildTimestampFilter(startDate, endDate),
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    res.json({ data });
  } catch (error) {
    console.error("Error fetching sensor data series:", error);
    res.status(500).json({ error: "Failed to fetch sensor data series" });
  }
});

// Export sensor data to CSV
router.get("/sensor-data/export", async (req, res) => {
  try {
    const startDate = parseDate(req.query.start);
    const endDate = parseDate(req.query.end);

    const data = await prisma.sensorData.findMany({
      where: buildTimestampFilter(startDate, endDate),
      orderBy: { timestamp: "asc" },
    });

    const headers = ["id", "timestamp", "rpm", "torque", "maf", "temperature", "fuelConsumption", "customSensor", "alertStatus"];
    const escapeValue = (value) => {
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = value instanceof Date ? value.toISOString() : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = data.map((row) =>
      [
        escapeValue(row.id),
        escapeValue(row.timestamp),
        escapeValue(row.rpm),
        escapeValue(row.torque),
        escapeValue(row.maf),
        escapeValue(row.temperature),
        escapeValue(row.fuelConsumption),
        escapeValue(row.customSensor),
        escapeValue(row.alertStatus),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="sensor-data.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting sensor data:", error);
    res.status(500).json({ error: "Failed to export sensor data" });
  }
});

// Delete sensor data (optionally by range)
router.delete("/sensor-data", async (req, res) => {
  try {
    const startDate = parseDate(req.query.start);
    const endDate = parseDate(req.query.end);

    const where = buildTimestampFilter(startDate, endDate);

    const result = await prisma.sensorData.deleteMany({
      where,
    });

    res.json({
      deletedCount: result.count,
      range: where
        ? {
            start: startDate ?? null,
            end: endDate ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error deleting sensor data:", error);
    res.status(500).json({ error: "Failed to delete sensor data" });
  }
});

export default router;
