import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sensorRoutes from "./routes/sensorRoutes.js";

const buildCorsOptions = () => {
  const explicitOrigins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || process.env.DESKTOP_APP_ORIGINS;

  if (!explicitOrigins) {
    return { origin: "*" };
  }

  const allowed = explicitOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowed.length ? { origin: allowed } : { origin: "*" };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveStaticDirectory = () => {
  const candidates = [];

  if (process.env.FRONTEND_DIST_PATH) {
    candidates.push(path.resolve(__dirname, process.env.FRONTEND_DIST_PATH));
  }

  candidates.push(path.resolve(__dirname, "../public"), path.resolve(__dirname, "../../frontend/dist"), path.resolve(process.cwd(), "public"));

  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate) && fs.existsSync(path.join(candidate, "index.html"));
    } catch {
      return false;
    }
  });
};

const STATIC_DIR = resolveStaticDirectory();

export function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json());

  app.use("/api", sensorRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      message: "EMSys - Engine Monitoring System API is running",
      timestamp: new Date().toISOString(),
    });
  });

  if (STATIC_DIR) {
    app.use(express.static(STATIC_DIR));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(STATIC_DIR, "index.html"));
    });
  }

  return app;
}
