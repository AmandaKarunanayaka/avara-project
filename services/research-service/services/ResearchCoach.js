import createError from "http-errors";
import ResearchDoc from "../models/ResearchDoc.js";
import { chatPatchDoc } from "./chatPatch.js";

export async function researchCoachChat({ userId, projectId, message }) {
  const doc = await ResearchDoc.findOne({ userId, projectId });
  if (!doc) throw createError(404, "Research document not found");

  const { assistantMessage, patch } = await chatPatchDoc({
    doc,
    message,
    domain: "research",
  });

  const p = patch || {};

  // summary patch
  if (p.summary && typeof p.summary === "object") {
    doc.summary = { ...(doc.summary || {}), ...p.summary };
  }

  // sections patch
  if (Array.isArray(p.sections)) {
    for (const s of p.sections) {
      if (!s.id) continue;
      const idx = (doc.sections || []).findIndex((sec) => sec.id === s.id);
      if (idx === -1) continue;

      // mongoose doc vs plain object safety
      const base = typeof doc.sections[idx].toObject === "function"
        ? doc.sections[idx].toObject()
        : doc.sections[idx];

      doc.sections[idx] = { ...base, ...s };
    }
  }

  await doc.save();

  return {
    assistantMessage:
      assistantMessage ||
      "Okay, I’ve updated your research pack based on that.",
    patch: p,
    updatedDoc: doc,
  };
}
