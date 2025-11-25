// services/core-business-service/models/CoreDoc.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const CoreDocSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },

    // Business core setup
    purpose: { type: String },
    mission: { type: String },
    vision: { type: String },
    strategicFocus: { type: String },

    // Optional: extra fields
    brandValues: [{ type: String }],
    tagline: { type: String },
  },
  { timestamps: true }
);

CoreDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const CoreDoc =
  mongoose.models.CoreDoc || mongoose.model("CoreDoc", CoreDocSchema);

export default CoreDoc;
