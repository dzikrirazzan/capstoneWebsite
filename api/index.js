import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method, url } = req;

  // Parse URL properly
  const path = url.split("?")[0]; // Remove query params

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
        where = {};
        if (startParam) {
          startTime = new Date(startParam);
          where.timestamp = { ...where.timestamp, gte: startTime };
        }
        if (endParam) {
          endTime = new Date(endParam);
          where.timestamp = { ...where.timestamp, lte: endTime };
        }
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

      let where = undefined;

      if (startParam || endParam) {
        where = {};
        if (startParam) {
          where.timestamp = { ...where.timestamp, gte: new Date(startParam) };
        }
        if (endParam) {
          where.timestamp = { ...where.timestamp, lte: new Date(endParam) };
        }
      }

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

      let where = undefined;

      if (startParam || endParam) {
        where = {};
        if (startParam) {
          where.timestamp = { ...where.timestamp, gte: new Date(startParam) };
        }
        if (endParam) {
          where.timestamp = { ...where.timestamp, lte: new Date(endParam) };
        }
      }

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
      workbook.creator = "FuelSense - Engine Monitoring System";
      workbook.created = new Date();

      // ===== SHEET 1: Sensor Data =====
      const dataSheet = workbook.addWorksheet("Sensor Data");

      // Title and Date Range Info
      dataSheet.mergeCells("A1:F1");
      dataSheet.getCell("A1").value = "FUELSENSE - SENSOR DATA EXPORT";
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

      dataSheet.getCell("A5").value = "Timestamp";
      dataSheet.getCell("B5").value = "Torsi (Nm)";
      dataSheet.getCell("C5").value = "BBM (L/h)";
      dataSheet.getCell("D5").value = "RPM";
      dataSheet.getCell("E5").value = "Temperature (°C)";
      dataSheet.getCell("F5").value = "MAF (g/s)";

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
          torque: row.torque,
          fuelConsumption: row.fuelConsumption,
          rpm: row.rpm,
          temperature: row.temperature,
          maf: row.maf,
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
      summarySheet.getCell("A1").value = "FUELSENSE - ENGINE MONITORING SYSTEM - DATA SUMMARY";
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
        ["BBM", stats.fuelConsumption.current.toFixed(2), stats.fuelConsumption.average.toFixed(2), stats.fuelConsumption.min.toFixed(2), stats.fuelConsumption.max.toFixed(2), "L/h"],
        ["RPM", stats.rpm.current.toFixed(0), stats.rpm.average.toFixed(0), stats.rpm.min.toFixed(0), stats.rpm.max.toFixed(0), "RPM"],
        ["Temperature", stats.temperature.current.toFixed(1), stats.temperature.average.toFixed(1), stats.temperature.min.toFixed(1), stats.temperature.max.toFixed(1), "°C"],
        ["MAF", stats.maf.current.toFixed(1), stats.maf.average.toFixed(1), stats.maf.min.toFixed(1), stats.maf.max.toFixed(1), "g/s"],
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
        fgColor: { argb: "#F97316" },
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
        fgColor: { argb: "#EA580C" },
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
      const filename = `FuelSenseData_${fileTimestamp}.xlsx`;

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
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.sensorData.findMany({
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: skip,
        }),
        prisma.sensorData.count(),
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
