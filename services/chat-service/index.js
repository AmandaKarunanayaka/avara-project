import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import "./db.js";
import chatRoutes from "./routes/ChatRoutes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/chat", chatRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chat-service" });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`💬 Chat service running on port ${PORT}`);
});
