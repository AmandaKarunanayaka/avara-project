import mongoose from "mongoose";

const CitationSchema = new mongoose.Schema(
  { url: String, title: String, date: String, note: String },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  { id: String, title: String, critical: Boolean, html: String, citations: [CitationSchema] },
  { _id: false }
);

const SummarySchema = new mongoose.Schema(
  {
    problem: {
      state: { type: String, enum: ["validated", "refine", "not_validated"], default: "refine" },
      confidence: Number,
      why: String
    },
    solution: {
      state: { type: String, enum: ["validated", "refine", "no_solution"], default: "refine" },
      confidence: Number,
      why: String
    },
    nextStep: String,
    effort: { type: String, enum: ["S", "M", "L"], default: "S" },
    etaDays: Number
  },
  { _id: false }
);

const ExperimentSchema = new mongoose.Schema(
  { title: String, metric: String, deadline: Date },
  { _id: false }
);

const TimelineItemSchema = new mongoose.Schema(
  { week: Number, title: String, deliverable: String, exitCriteria: String },
  { _id: false }
);

const ResearchDocSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", index: true, required: true },
    projectId: { type: String, required: true }, 
    status: { type: String, default: "ready" }, 
    summary: SummarySchema,
    sections: [SectionSchema],
    experiments: [ExperimentSchema],
    timeline: [TimelineItemSchema]
  },
  { timestamps: true }
);

ResearchDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model("ResearchDoc", ResearchDocSchema);
