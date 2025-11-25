// services/risk-service/index.js
import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import createError from "http-errors";
import { connectDB } from "./config/db.js";

import roadmapRoutes from "./routes/roadmapRoutes.js";

const logger = pino({ name: process.env.SERVICE_NAME || "roadmap-service" });

async function main() {
  console.log("Connecting to MongoDB for roadmap-service...");

  await connectDB(process.env.MONGO_URI);

  const app = express();

  const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

  // 🔹 CORS
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.options(
    "*",
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp({ logger }));

  // Healthcheck
  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: process.env.SERVICE_NAME || "roadmap-service",
    });
  });

  // 🔹 API routes
  app.use("/roadmap", roadmapRoutes);

  // 404 handler
  app.use((req, res, next) => next(createError(404, "Not found")));

  // Error handler
  app.use((err, req, res, next) => {
    req.log?.error({ err }, "Unhandled error");
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  });

  const port = Number(process.env.PORT || 3006);
  app.listen(port, () => {
    logger.info(`roadmap-service listening on :${port}`);
  });
}

main().catch((e) => {
  logger.error(e, "Fatal startup error");
  process.exit(1);
});
