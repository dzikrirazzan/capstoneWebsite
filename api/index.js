import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

const parseDateParam = (value, fieldName) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${fieldName} date`);
    error.statusCode = 400;
    throw error;
  }

  return date;
};

const buildTimestampFilter = (startParam, endParam) => {
  const startTime = parseDateParam(startParam, "start");
  const endTime = parseDateParam(endParam, "end");

  if (startTime && endTime && startTime > endTime) {
    const error = new Error("Start date must be before end date");
    error.statusCode = 400;
    throw error;
  }

  const timestamp = {};
  if (startTime) timestamp.gte = startTime;
  if (endTime) timestamp.lte = endTime;

  return {
    where: startTime || endTime ? { timestamp } : undefined,
    startTime,
    endTime,
  };
};

export default async function handler(req, res) {
  const { method, url } = req;

  // Parse URL properly
  const path = url.split("?")[0]; // Remove query params

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
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

    // POST: Create new sensor data
    if (method === "POST" && path === "/api/sensor-data") {
      const { timestamp, rpm, torque, maf, temperature, fuelConsumption, customSensor, alertStatus } = req.body || {};

      // Helper function to parse numeric values
      const parseNumeric = (value) => {
        if (value === null || value === undefined || value === "") return undefined;
        const num = typeof value === "number" ? value : parseFloat(value);
        return !isNaN(num) ? num : undefined;
      };

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

      // Validate timestamp
      let parsedTimestamp = null;
      if (timestamp) {
        const ts = new Date(timestamp);
        if (!isNaN(ts.getTime())) {
          parsedTimestamp = ts;
        } else {
          return res.status(400).json({ error: "Invalid timestamp value" });
        }
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
      return res.status(201).json(savedData);
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
          alertStatus: false,
        });
      }

      return res.status(200).json(latest);
    }

    // Get stats
    if (path === "/api/sensor-data/stats" || path.startsWith("/api/sensor-data/stats")) {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const range = urlObj.searchParams.get("range") || "all";
      const startParam = urlObj.searchParams.get("start");
      const endParam = urlObj.searchParams.get("end");

      let where = undefined;
      let startTime = null;
      let endTime = null;

      // Handle custom date range
      if (startParam || endParam) {
        const filter = buildTimestampFilter(startParam, endParam);
        where = filter.where;
        startTime = filter.startTime;
        endTime = filter.endTime;
      } else if (range !== "all") {
        // Handle predefined ranges
        const now = new Date();
        switch (range) {
          case "1h":
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case "24h":
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        if (startTime) {
          where = { timestamp: { gte: startTime } };
          endTime = now;
        }
      }

      const data = await prisma.sensorData.findMany({
        where: where,
        orderBy: { timestamp: "desc" },
      });

      const stats = {
        rpm: { avg: 0, min: 0, max: 0 },
        torque: { avg: 0, min: 0, max: 0 },
        temperature: { avg: 0, min: 0, max: 0 },
        maf: { avg: 0, min: 0, max: 0 },
        fuelConsumption: { avg: 0, min: 0, max: 0 },
        count: data.length,
        timeRange: range,
        period: {
          start: startTime,
          end: endTime,
        },
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
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const limit = parseInt(urlObj.searchParams.get("limit") || "1000", 10);
      const startParam = urlObj.searchParams.get("start");
      const endParam = urlObj.searchParams.get("end");

      const { where } = buildTimestampFilter(startParam, endParam);

      const data = await prisma.sensorData.findMany({
        where: where,
        orderBy: { timestamp: "asc" },
        take: limit,
      });

      return res.status(200).json({ data: data });
    }

    // Export sensor data to Excel
    if (path === "/api/sensor-data/export" || path.startsWith("/api/sensor-data/export")) {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const startParam = urlObj.searchParams.get("start");
      const endParam = urlObj.searchParams.get("end");

      const { where } = buildTimestampFilter(startParam, endParam);

      const data = await prisma.sensorData.findMany({
        where: where,
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

      // Title and Date Range Info
      dataSheet.mergeCells("A1:F1");
      dataSheet.getCell("A1").value = "EMSys - EKSPOR DATA SENSOR";
      dataSheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      dataSheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      dataSheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      dataSheet.getRow(1).height = 25;

      // Date Range Info
      const dateRangeText =
        startParam && endParam
          ? `Data Range: ${formatTimestamp(new Date(startParam))} - ${formatTimestamp(new Date(endParam))}`
          : startParam
          ? `Data From: ${formatTimestamp(new Date(startParam))}`
          : endParam
          ? `Data Until: ${formatTimestamp(new Date(endParam))}`
          : "Data Range: All Data";

      dataSheet.mergeCells("A2:F2");
      dataSheet.getCell("A2").value = dateRangeText;
      dataSheet.getCell("A2").font = { bold: true, size: 11 };
      dataSheet.getCell("A2").alignment = { horizontal: "center" };
      dataSheet.getRow(2).height = 20;

      // Export Date
      dataSheet.mergeCells("A3:F3");
      dataSheet.getCell("A3").value = `Exported: ${exportDate} | Total Records: ${data.length}`;
      dataSheet.getCell("A3").font = { size: 10, color: { argb: "FF666666" } };
      dataSheet.getCell("A3").alignment = { horizontal: "center" };
      dataSheet.getRow(3).height = 18;

      // Empty row
      dataSheet.getRow(4).height = 5;

      // Column headers (row 5)
      dataSheet.columns = [
        { header: "", key: "timestamp", width: 20 },
        { header: "", key: "torque", width: 12 },
        { header: "", key: "fuelConsumption", width: 12 },
        { header: "", key: "rpm", width: 10 },
        { header: "", key: "temperature", width: 18 },
        { header: "", key: "maf", width: 12 },
      ];

      dataSheet.getCell("A5").value = "Waktu";
      dataSheet.getCell("B5").value = "RPM";
      dataSheet.getCell("C5").value = "Torsi (Nm)";
      dataSheet.getCell("D5").value = "MAF (g/s)";
      dataSheet.getCell("E5").value = "Suhu (°C)";
      dataSheet.getCell("F5").value = "Konsumsi BBM (L/h)";

      // Style header row
      dataSheet.getRow(5).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      dataSheet.getRow(5).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E5C8A" },
      };
      dataSheet.getRow(5).alignment = { horizontal: "center", vertical: "middle" };
      dataSheet.getRow(5).height = 22;

      // Add data rows (starting from row 6)
      let currentRow = 6;
      data.forEach((row) => {
        dataSheet.addRow({
          timestamp: formatTimestamp(row.timestamp),
          rpm: row.rpm,
          torque: row.torque,
          maf: row.maf,
          temperature: row.temperature,
          fuelConsumption: row.fuelConsumption,
        });
        currentRow++;
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
      summarySheet.getCell("A1").value = "EMSys - RINGKASAN DATA SENSOR";
      summarySheet.getCell("A1").font = { bold: true, size: 14 };
      summarySheet.mergeCells("A1:F1");

      // Metadata
      summarySheet.getCell("A3").value = "Tanggal Ekspor:";
      summarySheet.getCell("B3").value = exportDate;
      summarySheet.getCell("A4").value = "Total Data:";
      summarySheet.getCell("B4").value = data.length;
      summarySheet.getCell("A5").value = "Durasi:";
      summarySheet.getCell("B5").value = `${durationMinutes} menit`;

      // Statistics table header
      summarySheet.getCell("A7").value = "Parameter";
      summarySheet.getCell("B7").value = "Terkini";
      summarySheet.getCell("C7").value = "Rata-rata";
      summarySheet.getCell("D7").value = "Minimum";
      summarySheet.getCell("E7").value = "Maksimum";
      summarySheet.getCell("F7").value = "Satuan";

      const headerRow = summarySheet.getRow(7);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };

      // Statistics data
      const statsData = [
        ["RPM", stats.rpm.current.toFixed(0), stats.rpm.average.toFixed(0), stats.rpm.min.toFixed(0), stats.rpm.max.toFixed(0), "RPM"],
        ["Torsi", stats.torque.current.toFixed(2), stats.torque.average.toFixed(2), stats.torque.min.toFixed(2), stats.torque.max.toFixed(2), "Nm"],
        ["MAF", stats.maf.current.toFixed(1), stats.maf.average.toFixed(1), stats.maf.min.toFixed(1), stats.maf.max.toFixed(1), "g/s"],
        ["Suhu", stats.temperature.current.toFixed(1), stats.temperature.average.toFixed(1), stats.temperature.min.toFixed(1), stats.temperature.max.toFixed(1), "°C"],
        ["Konsumsi BBM", stats.fuelConsumption.current.toFixed(2), stats.fuelConsumption.average.toFixed(2), stats.fuelConsumption.min.toFixed(2), stats.fuelConsumption.max.toFixed(2), "L/h"],
      ];

      statsData.forEach((rowData, index) => {
        const row = summarySheet.getRow(8 + index);
        row.values = [rowData[0], parseFloat(rowData[1]), parseFloat(rowData[2]), parseFloat(rowData[3]), parseFloat(rowData[4]), rowData[5]];
        row.font = { bold: true };
      });

      // ===== SHEET 3: Charts & Visualization =====
      const chartSheet = workbook.addWorksheet("Charts & Visualization");

      // Title
      chartSheet.mergeCells("A1:F1");
      chartSheet.getCell("A1").value = "SENSOR DATA FOR VISUALIZATION";
      chartSheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      chartSheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF97316" },
      };
      chartSheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      chartSheet.getRow(1).height = 25;

      // Instructions
      chartSheet.mergeCells("A2:F2");
      chartSheet.getCell("A2").value = "📊 Use this data to create charts in Excel (Insert → Chart → Line/Column)";
      chartSheet.getCell("A2").font = { size: 10, italic: true, color: { argb: "FF666666" } };
      chartSheet.getCell("A2").alignment = { horizontal: "center" };

      // Empty row
      chartSheet.getRow(3).height = 5;

      // Prepare chart data - Use sample points to avoid overcrowding
      const maxDataPoints = 100; // Limit to 100 points for cleaner charts
      const step = Math.ceil(data.length / maxDataPoints);
      const sampledData = data.filter((_, index) => index % step === 0 || index === data.length - 1);

      // Data table header
      chartSheet.getCell("A4").value = "Index";
      chartSheet.getCell("B4").value = "RPM";
      chartSheet.getCell("C4").value = "Temperature (°C)";
      chartSheet.getCell("D4").value = "Torque (Nm)";
      chartSheet.getCell("E4").value = "Fuel (L/h)";
      chartSheet.getCell("F4").value = "MAF (g/s)";

      chartSheet.getRow(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
      chartSheet.getRow(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA580C" },
      };
      chartSheet.getRow(4).alignment = { horizontal: "center", vertical: "middle" };
      chartSheet.getRow(4).height = 22;

      // Add sampled data for visualization
      sampledData.forEach((row, index) => {
        chartSheet.addRow([index + 1, row.rpm, row.temperature, row.torque, row.fuelConsumption, row.maf]);
      });

      // Set column widths for better readability
      chartSheet.getColumn(1).width = 10;
      chartSheet.getColumn(2).width = 12;
      chartSheet.getColumn(3).width = 18;
      chartSheet.getColumn(4).width = 15;
      chartSheet.getColumn(5).width = 15;
      chartSheet.getColumn(6).width = 12;

      // Generate filename
      const fileTimestamp = formatTimestamp(now).replace(/[: ]/g, "").replace(/-/g, "");
      const filename = `EMSysData_${fileTimestamp}.xlsx`;

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    // Get all sensor data with pagination (must be last)
    if (path === "/api/sensor-data") {
      // Parse query params for pagination
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const page = parseInt(urlObj.searchParams.get("page") || "1", 10);
      const limit = parseInt(urlObj.searchParams.get("limit") || "100", 10);
      const startParam = urlObj.searchParams.get("start");
      const endParam = urlObj.searchParams.get("end");
      const { where } = buildTimestampFilter(startParam, endParam);
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.sensorData.findMany({
          where,
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: skip,
        }),
        prisma.sensorData.count({ where }),
      ]);

      return res.status(200).json({
        data: data,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // POST: Generate dummy data for testing
    if (method === "POST" && (path === "/api/dummy-data" || path.startsWith("/api/dummy-data"))) {
      // Generate 50 realistic engine sensor data records spread over the last 24 hours
      const now = new Date();
      const records = [];
      const totalRecords = 50;

      for (let i = 0; i < totalRecords; i++) {
        // Spread records over the last 24 hours
        const minutesAgo = ((totalRecords - i) / totalRecords) * 24 * 60;
        const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);

        // Simulate realistic engine patterns
        const phase = i / totalRecords; // 0 to 1
        const isHighLoad = phase > 0.3 && phase < 0.7;
        const isIdling = phase < 0.1 || phase > 0.9;

        // RPM: idle ~800-1000, normal ~1500-3500, high load ~3000-5000
        let baseRpm = isIdling ? 850 : isHighLoad ? 3500 : 2200;
        const rpm = baseRpm + (Math.random() - 0.5) * (isHighLoad ? 1500 : 800);

        // Torque: correlated with RPM, 50-350 Nm
        const torque = (rpm / 5500) * 280 + (Math.random() - 0.5) * 40;

        // MAF: correlated with RPM, 5-80 g/s
        const maf = (rpm / 6000) * 65 + (Math.random() - 0.5) * 10;

        // Temperature: gradually increases, 70-95°C normal
        const tempBase = 72 + phase * 18;
        const temperature = tempBase + (Math.random() - 0.5) * 6;

        // Fuel consumption: correlated with RPM, 3-15 L/h
        const fuelConsumption = (rpm / 5500) * 12 + (Math.random() - 0.5) * 2;

        records.push({
          timestamp,
          rpm: Math.max(600, Math.round(rpm * 10) / 10),
          torque: Math.max(30, Math.round(torque * 100) / 100),
          maf: Math.max(3, Math.round(maf * 10) / 10),
          temperature: Math.max(60, Math.round(temperature * 10) / 10),
          fuelConsumption: Math.max(1, Math.round(fuelConsumption * 100) / 100),
          customSensor: -999, // Marker to identify dummy data
          alertStatus: false,
        });
      }

      // Insert all records
      const result = await prisma.sensorData.createMany({ data: records });

      return res.status(201).json({
        message: `Successfully created ${result.count} dummy data records`,
        count: result.count,
        marker: "customSensor = -999",
      });
    }

    // DELETE: Remove dummy data
    if (method === "DELETE" && (path === "/api/dummy-data" || path.startsWith("/api/dummy-data"))) {
      const result = await prisma.sensorData.deleteMany({
        where: { customSensor: -999 },
      });

      return res.status(200).json({
        message: `Successfully deleted ${result.count} dummy data records`,
        count: result.count,
      });
    }

    // DELETE: Remove sensor data (existing functionality)
    if (method === "DELETE" && path === "/api/sensor-data") {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const startParam = urlObj.searchParams.get("start");
      const endParam = urlObj.searchParams.get("end");

      const { where } = buildTimestampFilter(startParam, endParam);

      const result = await prisma.sensorData.deleteMany({ where });

      return res.status(200).json({
        message: `Deleted ${result.count} records`,
        count: result.count,
      });
    }

    // Not found
    return res.status(404).json({ error: "Not found", path });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? "Bad request" : "Internal server error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
