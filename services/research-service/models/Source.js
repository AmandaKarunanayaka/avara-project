import mongoose from "mongoose";

const SourceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", index: true, required: true },
    projectId: { type: String, index: true, required: true },

    type: { type: String, enum: ["user_intake", "web", "pdf", "note"], default: "web" },
    url: String,
    title: String,
    date: String,
    snippet: String,
    topic: String, // competitor, macro, pain, pricing, gtm ...

    embedding: { type: [Number], default: undefined }
  },
  { timestamps: true }
);

// Speed up sources-by-project
SourceSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

export default mongoose.model("Source", SourceSchema);
