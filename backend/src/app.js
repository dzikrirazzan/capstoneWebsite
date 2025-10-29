import express from "express";
import cors from "cors";
import sensorRoutes from "./routes/sensorRoutes.js";

const buildCorsOptions = () => {
  const explicitOrigins =
    process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || process.env.DESKTOP_APP_ORIGINS;

  if (!explicitOrigins) {
    return { origin: "*" };
  }

  const allowed = explicitOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowed.length ? { origin: allowed } : { origin: "*" };
};

export function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json());

  app.use("/api", sensorRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      message: "FuelSense Monitor API is running",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
