import { createServer } from "http";
import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
});
