import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import createError from "http-errors";
import { connectDB } from "./config/db.js";
import researchRoutes from "./routes/researchRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const logger = pino({ name: process.env.SERVICE_NAME || "research-service" });

async function main() {
  await connectDB(process.env.MONGO_URI);
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp({ logger }));

  app.get("/health", (req, res) => res.json({ ok: true, service: process.env.SERVICE_NAME }));

  app.use("/research", researchRoutes);
  app.use("/chat", chatRoutes);

  app.use((req, res, next) => next(createError(404, "Not found")));
  app.use((err, req, res, next) => {
    req.log?.error({ err }, "Unhandled error");
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  });

  const port = process.env.PORT || 8082;
  app.listen(port, () => logger.info(`research-service listening on :${port}`));
}

main().catch((e) => {
  logger.error(e, "Fatal startup error");
  process.exit(1);
});
