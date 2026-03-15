import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import adminRoutes from "./routes/admin.js";
import verifyRoutes from "./routes/verify.js";
import { verifyLimiter } from "./middleware/rateLimit.js";

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*"
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/verify", verifyLimiter, verifyRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}