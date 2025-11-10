import mongoose from "mongoose";

const IntakeSchema = new mongoose.Schema(
  {
    name: String,
    industry: String,
    problem: String,
    problemValidated: { type: Boolean, default: false },
    solution: String,
    solutionExists: { type: Boolean, default: false },
    solutionValidated: { type: Boolean, default: false },
    progressBrief: String,
    teamCount: Number,
    teamSkills: [String],
    capital: Number
  },
  { _id: false }
);

const GatesSchema = new mongoose.Schema(
  {
    problemValidationNeeded: { type: Boolean, default: false },
    solutionValidationNeeded: { type: Boolean, default: false },
    userApprovedExperiments: { type: Boolean, default: false },
    userApprovedProceedToGTM: { type: Boolean, default: false }
  },
  { _id: false }
);

const ProjectContextSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", index: true, required: true },
    projectId: { type: String, required: true }, 
    intake: IntakeSchema,
    state: {
      type: String,
      enum: ["research", "validation", "gtm_ready", "risk", "roadmap"],
      default: "research"
    },
    gates: GatesSchema
  },
  { timestamps: true }
);

ProjectContextSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model("ProjectContext", ProjectContextSchema);
