import { Router } from "express";
import ExcelJS from "exceljs";
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
    const { timestamp, rpm, torque, maf, temperature, fuelConsumption, customSensor, alertStatus } = req.body ?? {};

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

// Export sensor data to Excel (.xlsx) with multiple sheets
router.get("/sensor-data/export", async (req, res) => {
  try {
    const startDate = parseDate(req.query.start);
    const endDate = parseDate(req.query.end);

    const data = await prisma.sensorData.findMany({
      where: buildTimestampFilter(startDate, endDate),
      orderBy: { timestamp: "asc" },
    });

    if (data.length === 0) {
      return res.status(404).json({ error: "No data to export" });
    }

    const formatTimestamp = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Calculate statistics
    const stats = {
      torque: { values: data.map((d) => d.torque) },
      fuelConsumption: { values: data.map((d) => d.fuelConsumption) },
      rpm: { values: data.map((d) => d.rpm) },
      temperature: { values: data.map((d) => d.temperature) },
      maf: { values: data.map((d) => d.maf) },
    };

    Object.keys(stats).forEach((key) => {
      const values = stats[key].values;
      stats[key].current = values[values.length - 1];
      stats[key].average = values.reduce((sum, v) => sum + v, 0) / values.length;
      stats[key].min = Math.min(...values);
      stats[key].max = Math.max(...values);
    });

    // Calculate duration
    const firstTimestamp = new Date(data[0].timestamp);
    const lastTimestamp = new Date(data[data.length - 1].timestamp);
    const durationMinutes = ((lastTimestamp - firstTimestamp) / 1000 / 60).toFixed(1);

    const now = new Date();
    const exportDate = formatTimestamp(now);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EMSys - Engine Monitoring System";
    workbook.created = new Date();

    // ===== SHEET 1: Sensor Data =====
    const dataSheet = workbook.addWorksheet("Sensor Data");
    dataSheet.columns = [
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Torsi (Nm)", key: "torque", width: 12 },
      { header: "BBM (gram)", key: "fuelConsumption", width: 12 },
      { header: "RPM", key: "rpm", width: 10 },
      { header: "Temperature (°C)", key: "temperature", width: 18 },
      { header: "MAF (rpm)", key: "maf", width: 12 },
    ];

    // Style header row
    dataSheet.getRow(1).font = { bold: true, size: 11 };
    dataSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    dataSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    data.forEach((row) => {
      dataSheet.addRow({
        timestamp: formatTimestamp(row.timestamp),
        torque: row.torque,
        fuelConsumption: row.fuelConsumption,
        rpm: row.rpm,
        temperature: row.temperature,
        maf: row.maf,
      });
    });

    // ===== SHEET 2: Summary =====
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.getColumn(1).width = 20;
    summarySheet.getColumn(2).width = 15;
    summarySheet.getColumn(3).width = 12;
    summarySheet.getColumn(4).width = 12;
    summarySheet.getColumn(5).width = 12;
    summarySheet.getColumn(6).width = 10;

    // Title
    summarySheet.getCell("A1").value = "EMSys - ENGINE MONITORING SYSTEM - DATA SUMMARY";
    summarySheet.getCell("A1").font = { bold: true, size: 14 };
    summarySheet.mergeCells("A1:F1");

    // Metadata
    summarySheet.getCell("A3").value = "Export Date:";
    summarySheet.getCell("B3").value = exportDate;
    summarySheet.getCell("A4").value = "Total Records:";
    summarySheet.getCell("B4").value = data.length;
    summarySheet.getCell("A5").value = "Duration:";
    summarySheet.getCell("B5").value = `${durationMinutes} minutes`;

    // Statistics table header
    summarySheet.getCell("A7").value = "Parameter";
    summarySheet.getCell("B7").value = "Current";
    summarySheet.getCell("C7").value = "Average";
    summarySheet.getCell("D7").value = "Minimum";
    summarySheet.getCell("E7").value = "Maximum";
    summarySheet.getCell("F7").value = "Unit";

    const headerRow = summarySheet.getRow(7);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };

    // Statistics data
    const statsData = [
      ["Torsi", stats.torque.current.toFixed(2), stats.torque.average.toFixed(2), stats.torque.min.toFixed(2), stats.torque.max.toFixed(2), "Nm"],
      ["BBM", stats.fuelConsumption.current.toFixed(2), stats.fuelConsumption.average.toFixed(2), stats.fuelConsumption.min.toFixed(2), stats.fuelConsumption.max.toFixed(2), "gram"],
      ["RPM", stats.rpm.current.toFixed(0), stats.rpm.average.toFixed(0), stats.rpm.min.toFixed(0), stats.rpm.max.toFixed(0), "RPM"],
      ["Temperature", stats.temperature.current.toFixed(1), stats.temperature.average.toFixed(1), stats.temperature.min.toFixed(1), stats.temperature.max.toFixed(1), "°C"],
      ["MAF", stats.maf.current.toFixed(1), stats.maf.average.toFixed(1), stats.maf.min.toFixed(1), stats.maf.max.toFixed(1), "rpm"],
    ];

    statsData.forEach((rowData, index) => {
      const row = summarySheet.getRow(8 + index);
      row.values = [rowData[0], parseFloat(rowData[1]), parseFloat(rowData[2]), parseFloat(rowData[3]), parseFloat(rowData[4]), rowData[5]];
      row.font = { bold: true };
    });

    // ===== SHEET 3: Charts & Visualization =====
    const chartSheet = workbook.addWorksheet("Charts & Visualization");
    chartSheet.getColumn(1).width = 12;
    chartSheet.getColumn(2).width = 12;
    chartSheet.getColumn(3).width = 12;
    chartSheet.getColumn(4).width = 12;
    chartSheet.getColumn(5).width = 18;
    chartSheet.getColumn(6).width = 12;

    // Title
    chartSheet.getCell("A1").value = "SENSOR DATA VISUALIZATION";
    chartSheet.getCell("A1").font = { bold: true, size: 14 };
    chartSheet.mergeCells("A1:F1");

    // Chart data header
    chartSheet.getCell("A3").value = "Time";
    chartSheet.getCell("B3").value = "Torsi";
    chartSheet.getCell("C3").value = "BBM";
    chartSheet.getCell("D3").value = "RPM";
    chartSheet.getCell("E3").value = "Temperature";
    chartSheet.getCell("F3").value = "MAF";

    const chartHeaderRow = chartSheet.getRow(3);
    chartHeaderRow.font = { bold: true };
    chartHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };

    // Add chart data (numbered sequence for easy plotting)
    data.forEach((row, index) => {
      chartSheet.addRow([index + 1, row.torque, row.fuelConsumption, row.rpm, row.temperature, row.maf]);
    });

    // Generate filename
    const fileTimestamp = formatTimestamp(now).replace(/[: ]/g, "").replace(/-/g, "");
    const filename = `EMSysData_${fileTimestamp}.xlsx`;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
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
