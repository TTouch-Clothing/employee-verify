import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import adminRoutes from "./routes/admin.js";
import verifyRoutes from "./routes/verify.js";
import { verifyLimiter } from "./middleware/rateLimit.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

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

    if (err.message?.startsWith("CORS blocked")) {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}