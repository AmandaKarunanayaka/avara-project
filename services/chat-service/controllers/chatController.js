import createError from "http-errors";
import { z } from "zod";

import ResearchDoc from "../../research-service/models/ResearchDoc.js";
import ProjectContext from "../../research-service/models/ProjectContext.js";

import { chatPatchResearch } from "../services/chatPatchResearch.js";
import { chatPatchIntake } from "../services/chatPatchIntake.js";

const bodySchema = z.object({
  message: z.string().min(1),
});

const paramsSchema = z.object({
  service: z.enum(["research", "intake"]),
  projectId: z.string().min(1),
});

export const chatWithAgent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message } = bodySchema.parse(req.body);
    const { service, projectId } = paramsSchema.parse(req.params);

    let payload;

    switch (service) {
      case "research": {
        const doc = await ResearchDoc.findOne({ userId, projectId });
        if (!doc) throw createError(404, "Research document not found");

        const patchResult = await chatPatchResearch({ doc, message });

        applyResearchPatch(doc, patchResult.patch);
        await doc.save();

        payload = {
          service: "research",
          doc,
          patch: patchResult.patch,
          reply: patchResult.reply,
        };
        break;
      }

      case "intake": {
        const ctx = await ProjectContext.findOne({ userId, projectId });
        if (!ctx) throw createError(404, "Project context not found");

        const patchResult = await chatPatchIntake({ ctx, message });

        applyIntakePatch(ctx, patchResult.patch);
        await ctx.save();

        payload = {
          service: "intake",
          context: ctx,
          patch: patchResult.patch,
          reply: patchResult.reply,
        };
        break;
      }

      default: {
        throw createError(400, `Unknown chat service: ${service}`);
      }
    }

    res.json(payload);
  } catch (err) {
    console.error("Error in chatWithAgent:", err);
    next(err);
  }
};

function applyResearchPatch(doc, patch = {}) {
  if (!patch) return;

  // summary
  if (patch.summary && typeof patch.summary === "object") {
    doc.summary = { ...(doc.summary || {}), ...patch.summary };
  }

  // sections
  if (Array.isArray(patch.sections)) {
    const sections = doc.sections || [];
    for (const s of patch.sections) {
      if (!s.id) continue;
      const idx = sections.findIndex((sec) => sec.id === s.id);
      if (idx !== -1) {
        const base =
          typeof sections[idx].toObject === "function"
            ? sections[idx].toObject()
            : sections[idx];
        sections[idx] = { ...base, ...s };
      }
    }
    doc.sections = sections;
  }

  // personas
  if (Array.isArray(patch.personas)) {
    const personas = doc.personas || [];
    for (const p of patch.personas) {
      if (!p.id) continue;
      const idx = personas.findIndex((per) => per.id === p.id);
      if (idx === -1) {
        personas.push({
          ...p,
          updatedBy: "assistant",
          updatedAt: new Date(),
        });
      } else {
        const base =
          typeof personas[idx].toObject === "function"
            ? personas[idx].toObject()
            : personas[idx];
        personas[idx] = {
          ...base,
          ...p,
          updatedBy: "assistant",
          updatedAt: new Date(),
        };
      }
    }
    doc.personas = personas;
  }

  // competitors
  if (Array.isArray(patch.competitors)) {
    doc.competitors = patch.competitors;
  }

  // timeline
  if (Array.isArray(patch.timeline)) {
    doc.timeline = patch.timeline;
  }

  // meta
  if (patch.meta && typeof patch.meta === "object") {
    doc.meta = { ...(doc.meta || {}), ...patch.meta };
  }
}

function applyIntakePatch(ctx, patch = {}) {
  if (!patch) return;

  // intake
  if (patch.intake && typeof patch.intake === "object") {
    ctx.intake = { ...(ctx.intake || {}), ...patch.intake };
  }

  // meta (readyForResearch, needMoreInput, clarifyingQuestions)
  if (patch.meta && typeof patch.meta === "object") {
    ctx.meta = { ...(ctx.meta || {}), ...patch.meta };
  }

  // state
  if (patch.state && typeof patch.state === "string") {
    ctx.state = patch.state;
  }
}
