import mongoose from "mongoose";
const SourceSchema = new mongoose.Schema(
  {
    projectId: { type: String, index: true },
    url: String,
    title: String,
    date: String,
    snippet: String,
    topic: String // competitor|macro|pain|pricing|gtm...
  },
  { timestamps: true }
);
export default mongoose.model("Source", SourceSchema);
