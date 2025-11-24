import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", index: true, required: true },
    projectId: { type: String, required: true }, 
    name: { type: String, required: true },
    industry: { type: String },
    status: { type: String, default: "draft" } 
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });
ProjectSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Project", ProjectSchema);
