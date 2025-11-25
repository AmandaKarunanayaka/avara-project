// services/task-service/models/TaskDoc.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    id: String,
    title: String,
    description: String,
    category: String, // e.g. "research", "validation", "gtm"
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
    dueInDays: Number, // relative, we keep it simple
  },
  { _id: false }
);

const TaskDocSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    tasks: [TaskSchema],
  },
  { timestamps: true }
);

TaskDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const TaskDoc =
  mongoose.models.TaskDoc || mongoose.model("TaskDoc", TaskDocSchema);

export default TaskDoc;
