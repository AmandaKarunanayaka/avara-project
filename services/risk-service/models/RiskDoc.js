import mongoose from "mongoose";

const { Schema } = mongoose;

const RiskItemSchema = new Schema(
  {
    id: { type: String },
    scope: { type: String, enum: ["problem", "core", "gtm"] },
    title: { type: String },
    description: { type: String },
    category: { type: String }, // e.g. "Market", "Technical", "GTM"
    impact: { type: Number, min: 1, max: 5 }, // 1–5
    likelihood: { type: Number, min: 1, max: 5 },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    mitigation: { type: String },
    sourceHint: { type: String }, // e.g. "SWOT threats", "PEST", "GTM"
  },
  { _id: false }
);

const RiskDocSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },

    // keep latest merged view
    problemRisks: [RiskItemSchema],
    coreRisks: [RiskItemSchema],
    gtmRisks: [RiskItemSchema],

    summary: { type: String },
  },
  { timestamps: true }
);

RiskDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const RiskDoc =
  mongoose.models.RiskDoc || mongoose.model("RiskDoc", RiskDocSchema);

export default RiskDoc;
