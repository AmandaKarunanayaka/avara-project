// services/roadmap-service/models/RoadmapDoc.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const RoadmapMilestoneSchema = new Schema(
  {
    id: String,
    title: String,
    description: String,
    metric: String,
    dueOffsetWeeks: Number,
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { _id: false }
);

const RoadmapPhaseSchema = new Schema(
  {
    id: String,
    name: String,
    order: Number,
    durationWeeks: Number,
    objective: String,
    keyResult: String,
    milestones: [RoadmapMilestoneSchema],
  },
  { _id: false }
);

const RoadmapDocSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    horizonMonths: Number,
    overarchingGoal: String,
    summary: String,
    phases: [RoadmapPhaseSchema],
  },
  { timestamps: true }
);

RoadmapDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const RoadmapDoc =
  mongoose.models.RoadmapDoc || mongoose.model("RoadmapDoc", RoadmapDocSchema);

export default RoadmapDoc;
