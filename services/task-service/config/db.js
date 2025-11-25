import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is not set for risk-service");
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected (risk-service)");
  } catch (err) {
    console.error("❌ MongoDB connection error (risk-service):", err);
    throw err;
  }
}
