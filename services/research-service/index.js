// services/research-service/index.js
import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import createError from "http-errors";
import { connectDB } from "./config/db.js";

import researchRoutes from "./routes/researchRoutes.js";
import projectsRoutes from "./routes/projects.js";

const logger = pino({ name: process.env.SERVICE_NAME || "research-service" });

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  mongoose.set('debug', true);
  await connectDB(process.env.MONGO_URI);

  const app = express();

  // Basic middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp({ logger }));

  // Healthcheck
  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: process.env.SERVICE_NAME || "research-service",
    });
  });

  // 🔹 API routes
  app.use("/research", researchRoutes);
  app.use("/projects", projectsRoutes);

  // 404 handler (must be AFTER all routes)
  app.use((req, res, next) => next(createError(404, "Not found")));

  // Error handler
  app.use((err, req, res, next) => {
    req.log?.error({ err }, "Unhandled error");
    res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  });

  const port = Number(process.env.PORT || 3004);
  app.listen(port, () => {
    logger.info(`research-service listening on :${port}`);
  });
}

main().catch((e) => {
  logger.error(e, "Fatal startup error");
  process.exit(1);
});
