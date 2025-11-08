import createError from "http-errors";
import { z } from "zod";
import ProjectContext from "../models/ProjectContext.js";
import ResearchDoc from "../models/ResearchDoc.js";
import Source from "../models/Source.js";
import { decideValidation } from "../services/decision.js";
import { synthesizeDocument } from "../services/synthesizer.js";
import { normalizeResearchDoc } from "../services/normalizeDoc.js";

/** --------- Schemas ---------- */
const intakeSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  industry: z.string().min(1),
  problem: z.string().min(1),
  problemValidated: z.boolean().optional().default(false),
  solution: z.string().optional().default(""),
  solutionExists: z.boolean().optional().default(false),
  solutionValidated: z.boolean().optional().default(false),
  progressBrief: z.string().optional().default(""),
  teamCount: z.number().int().nonnegative().optional().default(1),
  teamSkills: z.array(z.string()).optional().default([]),
  capital: z.number().optional().default(0)
});

const advanceSchema = z.object({
  projectId: z.string().min(1),
  approveExperiments: z.boolean().optional(),
  approveProceedToGTM: z.boolean().optional()
});

/** --------- Controllers ---------- */
export const startResearch = async (req, res, next) => {
  try {
    const parsed = intakeSchema.parse(req.body);
    const { projectId, ...intake } = parsed;

    console.log("🚀 Starting research for:", projectId);
    console.log("📝 Intake:", JSON.stringify(intake, null, 2));

    const gate = decideValidation(intake);

    await ProjectContext.findOneAndUpdate(
      { projectId },
      {
        projectId,
        intake,
        state: "research",
        gates: {
          problemValidationNeeded: gate.needProblem,
          solutionValidationNeeded: gate.needSolution
        }
      },
      { upsert: true }
    );

    // MVP: no external sources yet
    const raw = await synthesizeDocument({ intake, sources: [], gtms: false });
    
    // CRITICAL DEBUG: See what AI actually returned
    console.log("🤖 AI returned:");
    console.log("  - Sections:", raw.sections?.length || 0);
    console.log("  - Experiments:", raw.experiments?.length || 0);
    console.log("  - First section HTML length:", raw.sections?.[0]?.html?.length || 0);
    console.log("  - First section HTML preview:", raw.sections?.[0]?.html?.substring(0, 100) || "N/A");
    
    const docJson = normalizeResearchDoc(raw, { projectId });
    
    console.log("✅ Normalized doc:");
    console.log("  - Sections:", docJson.sections?.length || 0);
    console.log("  - Experiments:", docJson.experiments?.length || 0);

    const doc = await ResearchDoc.findOneAndUpdate(
      { projectId },
      { $set: docJson },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log("💾 Saved to DB, returning response");

    res.json({ gate, doc });
  } catch (err) {
    console.error("❌ Error in startResearch:", err);
    next(err);
  }
};

// 2) Get current doc
export const getResearchDoc = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const doc = await ResearchDoc.findOne({ projectId });
    if (!doc) throw createError(404, "Research document not found");
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// 3) Advance gates via user approvals (Postman for now)
// - approveExperiments: marks experiments accepted
// - approveProceedToGTM: ONLY allowed if solution is validated (summary.solution.state === 'validated')
export const advanceGates = async (req, res, next) => {
  try {
    const { projectId, approveExperiments, approveProceedToGTM } = advanceSchema.parse(req.body);

    const ctx = await ProjectContext.findOne({ projectId });
    if (!ctx) throw createError(404, "Project not found");

    const doc = await ResearchDoc.findOne({ projectId });
    if (!doc) throw createError(404, "Doc not found");

    // 3a) approve experiments gate
    if (approveExperiments === true) {
      console.log("✓ Approving experiments gate");
      ctx.gates.userApprovedExperiments = true;
      ctx.state = "validation";
      await ctx.save();
    }

    // 3b) approve proceed to GTM (requires solution validated)
    if (approveProceedToGTM === true) {
      console.log("✓ Attempting GTM approval...");
      
      if (doc.summary?.solution?.state !== "validated") {
        console.log("❌ Solution not validated:", doc.summary?.solution?.state);
        throw createError(400, "Cannot proceed to GTM: solution not validated");
      }

      ctx.gates.userApprovedProceedToGTM = true;
      ctx.state = "gtm_ready";
      await ctx.save();

      console.log("🚀 Generating GTM sections...");
      
      // Generate GTM sections + timeline now (ONE call)
      const gtmdocRaw = await synthesizeDocument({
        intake: ctx.intake,
        sources: [], // TODO: pass real sources when search is integrated
        gtms: true
      });
      
      console.log("🤖 GTM AI returned:", gtmdocRaw.sections?.length || 0, "sections");
      
      const gtmdoc = normalizeResearchDoc(gtmdocRaw, { projectId });

      // Merge: keep earlier sections, replace/add GTM sections & timeline, update summary.nextStep
      doc.sections = mergeSections(doc.sections, gtmdoc.sections);
      doc.timeline = gtmdoc.timeline || [];
      doc.summary = {
        ...doc.summary,
        nextStep: "Execute GTM plan & prepare Risk Agent handoff",
        etaDays: 60
      };
      await doc.save();
      
      console.log("✅ GTM sections merged and saved");
    }

    res.json({ ok: true, context: ctx, doc });
  } catch (err) {
    console.error("❌ Error in advanceGates:", err);
    next(err);
  }
};

/** --------- Helpers ---------- */
function mergeSections(existing = [], incoming = []) {
  const map = new Map(existing.map((s) => [s.id, s]));
  for (const s of incoming) map.set(s.id, s);
  return Array.from(map.values());
}