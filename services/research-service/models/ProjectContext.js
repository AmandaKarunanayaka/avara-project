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
    capital: Number,

    // 🔹 Path type + resource fields
    pathType: {
      type: String,
      enum: ["problem", "resource"],
      default: "problem",
    },
    resourceDescription: String,
    resourceIntent: String,

    // 🔹 Region is critical for PEST/SWOT + competitor angle
    region: String,
  },
  { _id: false }
);

const GatesSchema = new mongoose.Schema(
  {
    problemValidationNeeded: { type: Boolean, default: false },
    solutionValidationNeeded: { type: Boolean, default: false },
    userApprovedExperiments: { type: Boolean, default: false },
    userApprovedProceedToGTM: { type: Boolean, default: false },
  },
  { _id: false }
);

const DraftSchema = new mongoose.Schema(
  {
    step: { type: Number, default: 0 },
    answers: {
      pathType: { type: String, enum: ["problem", "resource"] },
      industry: String,
      problem: String,
      problemValidated: { type: Boolean, default: false },
      solution: String,
      solutionExists: { type: Boolean, default: false },
      solutionValidated: { type: Boolean, default: false },
      resourceDescription: String,
      resourceIntent: String,
      teamCount: Number,
      teamSkills: [String],

      // 🔹 Region also captured at draft stage
      region: String,
    },
  },
  { _id: false }
);

const MetaSchema = new mongoose.Schema(
  {
    readyForResearch: { type: Boolean, default: false },
    needMoreInput: { type: Boolean, default: false },
    clarifyingQuestions: [{ type: String }],
  },
  { _id: false }
);

const ProjectContextSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    projectId: { type: String, required: true },

    intake: IntakeSchema,

    state: {
      type: String,
      enum: [
        "draft",
        "research",
        "research_ready",
        "validation",
        "gtm_ready",
        "risk",
        "roadmap",
      ],
      default: "draft",
    },

    gates: GatesSchema,

    draft: DraftSchema,

    meta: MetaSchema,
  },
  { timestamps: true }
);

ProjectContextSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model("ProjectContext", ProjectContextSchema);
