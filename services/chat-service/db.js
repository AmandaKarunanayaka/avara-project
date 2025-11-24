import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.warn("[chat-service] ⚠️ MONGO_URI is not set. Mongo will not connect.");
} else {
  mongoose
    .connect(uri) 
    .then(() => {
      console.log(`[chat-service] ✅ Connected to MongoDB (default DB)`);
    })
    .catch((err) => {
      console.error("[chat-service] ❌ Mongo connection error:", err.message);
    });
}

export default mongoose;
