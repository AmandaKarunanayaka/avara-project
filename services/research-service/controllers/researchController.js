// services/research-service/controllers/researchController.js
import createError from "http-errors";
import { z } from "zod";
import ProjectContext from "../models/ProjectContext.js";
import ResearchDoc from "../models/ResearchDoc.js";
import Project from "../models/Project.js";
import { decideValidation } from "../services/decision.js";
import { synthesizeDocument } from "../services/synthesizer.js";
import { normalizeResearchDoc } from "../services/normalizeDoc.js";
import {
  enrichIntakeWithHF,
  assessDocReliabilityWithHF,
} from "../services/hfInsights.js";
import { assessIntakeQuality } from "../services/intakeQuality.js";

// ---------- Schemas ----------

const baseIntakeSchema = z.object({
  projectId: z.string().min(1),
  pathType: z.enum(["problem", "resource"]).default("problem"),
  name: z.string().min(1),

  // Problem-first fields
  industry: z.string().optional().default(""),
  problem: z.string().optional().default(""),
  problemValidated: z.boolean().optional().default(false),

  // Solution fields (both flows can use these)
  solution: z.string().optional().default(""),
  solutionExists: z.boolean().optional().default(false),
  solutionValidated: z.boolean().optional().default(false),

  // Resource-first fields
  resourceDescription: z.string().optional().default(""),
  resourceIntent: z.string().optional().default(""),

  progressBrief: z.string().optional().default(""),
  teamCount: z.number().int().nonnegative().optional().default(1),
  teamSkills: z.array(z.string()).optional().default([]),
  capital: z.number().optional().default(0),

  // Region is important for PEST/SWOT & competitor lenses
  region: z.string().optional().default(""),
});

// Conditional validation depending on pathType
const intakeSchema = baseIntakeSchema.superRefine((val, ctx) => {
  if (val.pathType === "problem") {
    if (!val.industry || val.industry.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["industry"],
        message: "Industry is required and must be at least 3 characters.",
      });
    }
    if (!val.problem || val.problem.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["problem"],
        message: "Problem is required and must be at least 10 characters.",
      });
    }
  }

  if (val.pathType === "resource") {
    if (!val.resourceDescription || val.resourceDescription.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resourceDescription"],
        message: "Resource description is required and must be at least 10 characters.",
      });
    }
  }
});

const advanceSchema = z.object({
  approveExperiments: z.boolean().optional(),
  approveProceedToGTM: z.boolean().optional(),
});

// Draft schema: step + partial answers from the wizard
const draftAnswersSchema = z.object({
  pathType: z.enum(["problem", "resource"]).optional(),
  industry: z.string().optional(),
  problem: z.string().optional(),
  problemValidated: z.boolean().optional(),
  solution: z.string().optional(),
  solutionExists: z.boolean().optional(),
  solutionValidated: z.boolean().optional(),
  resourceDescription: z.string().optional(),
  resourceIntent: z.string().optional(),
  teamCount: z.number().int().nonnegative().optional(),
  teamSkills: z.array(z.string()).optional(),
  region: z.string().optional(),
});

const draftSchema = z.object({
  projectId: z.string().min(1),
  step: z.number().int().min(0).max(5),
  answers: draftAnswersSchema,
});

// Core triad updates
const coreUpdateSchema = z.object({
  projectId: z.string().min(1),
  field: z.enum(["problem", "solution", "persona", "persona_primary"]),
  text: z.string().optional(),
  personaId: z.string().optional(),
  validate: z.boolean().optional().default(false),
});

// ---------- Helper ----------

function mergeSections(existing = [], incoming = []) {
  const map = new Map((existing || []).map((s) => [s.id, s]));
  for (const s of incoming || []) map.set(s.id, s);
  return Array.from(map.values());
}

// ---------- Research Start (CORE PASS) ----------

export const startResearch = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = intakeSchema.parse(req.body);
    const { projectId, ...rawIntake } = parsed;

    let intake = { ...rawIntake };

    console.log("userId:", userId);
    console.log("Starting research for:", projectId);
    console.log("Intake (raw):", JSON.stringify(intake, null, 2));

    // --- Hugging Face enrichment: SPA, personas, competitors, clarifyingQuestions ---
    let hfExtras = null;
    try {
      hfExtras = await enrichIntakeWithHF(intake);
    } catch (hfErr) {
      console.error("HF enrichment failed, continuing without it:", hfErr);
    }

    // --- Intake quality (only for problem-first path) ---
    let quality = { isWeak: false, clarifyingQuestions: [] };
    try {
      if (intake.pathType === "problem") {
        quality = await assessIntakeQuality(intake);
      }
    } catch (qErr) {
      console.error("assessIntakeQuality failed, continuing:", qErr);
    }

    // Decide validation gates using final intake
    const gate = decideValidation(intake);

    // Persist context: final intake, clear draft, move to "research"
    const ctx = await ProjectContext.findOneAndUpdate(
      { userId, projectId },
      {
        $set: {
          userId,
          projectId,
          intake: {
            projectId,
            ...intake,
          },
          state: "research",
          gates: {
            problemValidationNeeded: gate.needProblem,
            solutionValidationNeeded: gate.needSolution,
          },
        },
        $unset: { draft: "" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // CORE synthesis – triad only
    const raw = await synthesizeDocument({
      intake,
      sources: [],
      spa: hfExtras?.spa || null,
      mode: "core",
      gtms: false,
    });

    console.log("AI core pass returned:");
    console.log("  - Sections:", raw.sections?.length || 0);
    console.log("  - Experiments:", raw.experiments?.length || 0);

    let docJson = normalizeResearchDoc(raw, { projectId });

    // Meta: SPA + clarifying questions + quality flags
    docJson.meta = {
      ...(docJson.meta || {}),
      spa: hfExtras?.spa || docJson.meta?.spa,
      clarifyingQuestions:
        (quality?.clarifyingQuestions?.length
          ? quality.clarifyingQuestions
          : null) ||
        docJson.meta?.clarifyingQuestions ||
        hfExtras?.clarifyingQuestions ||
        [],
      needMoreInput: !!quality?.isWeak,
    };

    // 🔥 Personas:
    // - For resource-first ideas, always trust HF exploration (wedge-finding).
    // - For problem-first, prefer synthesizer personas but fall back to HF.
    if (hfExtras?.personas?.length) {
      if (intake.pathType === "resource") {
        // Resource-first: HF personas become the source of truth
        docJson.personas = hfExtras.personas;
      } else if (!docJson.personas || !docJson.personas.length) {
        // Problem-first: keep LLM personas if they exist, else use HF
        docJson.personas = hfExtras.personas;
      }
    }

    // Fallback: If STILL no personas, create a default one to prevent errors
    if (!docJson.personas || !docJson.personas.length) {
      docJson.personas = [
        {
          id: "persona_default",
          type: "primary",
          title: "Target User",
          description: "A general user facing the problem described.",
          confidence: 1.0,
        },
      ];
    }

    // Ensure each persona has a stable id + structure for the UI
    docJson.personas = (docJson.personas || []).map((p, i) => ({
      id: p.id || `persona_${i}`,
      title: p.title || `Persona ${i + 1}`,
      description: p.description || "",
      confidence: p.confidence ?? 0.9,
      type: p.type || (i === 0 ? "primary" : "secondary"),
    }));

    // Initialise core triad using intake + summary + personas
    const primaryPersona =
      docJson.personas?.find((p) => p.type === "primary") ||
      docJson.personas?.[0] ||
      null;

    docJson.core = {
      ...(docJson.core || {}),
      problem: {
        text: intake.problem || docJson.summary?.problem?.notes || "",
        state: intake.problemValidated ? "validated" : "draft",
      },
      solution: {
        text: intake.solution || docJson.summary?.solution?.notes || "",
        state: intake.solutionValidated ? "validated" : "draft",
      },
      personaPrimaryId: primaryPersona?.id || null,
      locked: false,
      dirtyDownstream: true,
    };

    // Sync summary with the chosen core text (still editable later)
    docJson.summary = {
      ...(docJson.summary || {}),
      problem: {
        ...(docJson.summary?.problem || {}),
        notes: docJson.core.problem.text,
        state:
          docJson.summary?.problem?.state ||
          (intake.problemValidated ? "validated" : "unvalidated"),
      },
      solution: {
        ...(docJson.summary?.solution || {}),
        notes: docJson.core.solution.text,
        state:
          docJson.summary?.solution?.state ||
          (intake.solutionValidated ? "validated" : "unvalidated"),
      },
    };

    // --- HF critic: reliability / hallucination risk ---
    try {
      const reliability = await assessDocReliabilityWithHF({
        intake,
        doc: docJson,
      });
      docJson.meta.reliability = reliability;
    } catch (critErr) {
      console.error("HF critic failed, skipping reliability:", critErr);
    }

    console.log("Normalized + enriched doc (core only):");
    console.log("  - Sections:", docJson.sections?.length || 0);
    console.log("  - Experiments:", docJson.experiments?.length || 0);

    const doc = await ResearchDoc.findOneAndUpdate(
      { userId, projectId },
      {
        $set: {
          userId,
          projectId,
          pathType: intake.pathType,
          intake: intake,
          ...docJson,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("💾 Saved research doc for user:", userId);

    await Project.findOneAndUpdate(
      { userId, projectId },
      {
        $set: {
          status: "research",
          industry: intake.industry || "",
          name: intake.name,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    res.json({
      gate,
      doc,
      context: ctx,
    });
  } catch (err) {
    console.error("Error in startResearch:", err);
    next(err);
  }
};
// ---------------- GET RESEARCH DOC ----------------

export const getResearchDoc = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const [doc, ctx] = await Promise.all([
      ResearchDoc.findOne({ userId, projectId }),
      ProjectContext.findOne({ userId, projectId }),
    ]);

    if (!doc) throw createError(404, "Research document not found");

    res.json({
      doc,
      context: ctx || null,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- DRAFT HANDLING ----------------

export const saveIntakeDraft = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, step, answers } = draftSchema.parse(req.body);

    const ctx = await ProjectContext.findOneAndUpdate(
      { userId, projectId },
      {
        $set: {
          userId,
          projectId,
          "draft.step": step,
          "draft.answers": answers,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // push industry + region onto Project card as soon as we know it
    const update = {};
    if (answers.industry && answers.industry.trim().length > 0) {
      update.industry = answers.industry.trim();
    }
    if (answers.region && answers.region.trim().length > 0) {
      update.region = answers.region.trim();
    }
    if (Object.keys(update).length > 0) {
      await Project.findOneAndUpdate(
        { userId, projectId },
        {
          $set: {
            ...update,
            updatedAt: new Date(),
          },
        }
      );
    }

    res.json({ ok: true, draft: ctx.draft });
  } catch (err) {
    console.error("Error saving intake draft:", err);
    next(err);
  }
};

export const getIntakeDraft = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const ctx = await ProjectContext.findOne({ userId, projectId });
    if (!ctx || !ctx.draft) {
      // no draft yet → front end will just start at intro
      return res.status(204).end();
    }

    res.json({
      step: ctx.draft.step ?? 0,
      answers: ctx.draft.answers || {},
    });
  } catch (err) {
    console.error("Error fetching intake draft:", err);
    next(err);
  }
};

// ---------------- CORE TRIAD UPDATE ----------------

export const updateCore = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, field, text, personaId, validate } =
      coreUpdateSchema.parse(req.body);

    const [doc, ctx] = await Promise.all([
      ResearchDoc.findOne({ userId, projectId }),
      ProjectContext.findOne({ userId, projectId }),
    ]);

    if (!doc) throw createError(404, "Research document not found");
    if (!ctx) throw createError(404, "Project context not found");

    ctx.intake = ctx.intake || {};
    doc.core = doc.core || {};
    doc.summary = doc.summary || {};

    // --- Apply core update ---
    if (field === "problem") {
      if (!text) throw createError(400, "Text required for problem update");
      doc.core.problem = doc.core.problem || {};
      doc.core.problem.text = text;
      doc.core.problem.state = validate ? "validated" : "draft";

      doc.summary.problem = doc.summary.problem || {};
      doc.summary.problem.notes = text;
      doc.summary.problem.state = validate ? "validated" : "unvalidated";

      ctx.intake.problem = text;
      ctx.intake.problemValidated = !!validate;

      // --- Trigger solution regeneration if validating problem (ASYNC) ---
      if (validate) {
        console.log(`🔄 Problem validated. Generating/Refining solution (async)...`);

        // Invalidate solution with placeholder while background job runs
        doc.core.solution = doc.core.solution || {};
        if (!doc.core.solution.text || doc.core.solution.text.trim() === "") {
          doc.core.solution.text = "Avara is generating a solution based on your validated problem...";
        }
        doc.core.solution.state = "draft"; // Reset to draft until AI returns

        doc.summary.solution = doc.summary.solution || {};
        doc.summary.solution.state = "unvalidated";

        // Save initial state
        await doc.save();
        await ctx.save();

        // Trigger synthesis in background
        const primaryPersona = (doc.personas || []).find((p) => p.id === doc.core.personaPrimaryId) || (doc.personas || [])[0];

        synthesizeDocument({
          intake: ctx.intake,
          sources: [],
          spa: doc.meta?.spa || null,
          mode: "refine_solution",
          core: {
            problem: doc.core.problem,
            solution: doc.core.solution, // Pass current solution (even if empty/placeholder)
            primaryPersona,
          },
        })
          .then(async (refinedRaw) => {
            try {
              console.log("Background solution generation complete for project:", projectId);
              const freshDoc = await ResearchDoc.findOne({ userId, projectId });
              if (!freshDoc) return;

              const refined = normalizeResearchDoc(refinedRaw, { projectId });

              if (refined.summary?.solution?.notes) {
                freshDoc.core = freshDoc.core || {};
                freshDoc.core.solution = freshDoc.core.solution || {};
                freshDoc.core.solution.text = refined.summary.solution.notes;
                // We keep it as draft so user can review, or validated? 
                // Requirement: "Solution is considered validated (no extra manual step) – i.e. solutionValidated can be treated as true once core.locked === true."
                // But here we are just generating it. Let's keep it as draft/unvalidated until user locks core.
                freshDoc.core.solution.state = "draft";

                freshDoc.summary = freshDoc.summary || {};
                freshDoc.summary.solution = freshDoc.summary.solution || {};
                freshDoc.summary.solution.notes = refined.summary.solution.notes;
                freshDoc.summary.solution.state = "unvalidated";
              }

              if (refined.sections?.length) {
                freshDoc.sections = mergeSections(freshDoc.sections, refined.sections);
              }

              await freshDoc.save();
              console.log("Background solution generation saved for project:", projectId);
            } catch (err) {
              console.error("Error in background solution generation:", err);
            }
          })
          .catch((err) => {
            console.error("Unhandled error in background solution generation promise:", err);
          });
      }
    }

    if (field === "solution") {
      if (!text) throw createError(400, "Text required for solution update");
      doc.core.solution = doc.core.solution || {};
      doc.core.solution.text = text;
      doc.core.solution.state = validate ? "validated" : "draft";

      doc.summary.solution = doc.summary.solution || {};
      doc.summary.solution.notes = text;
      doc.summary.solution.state = validate ? "validated" : "unvalidated";

      ctx.intake.solution = text;
      ctx.intake.solutionValidated = !!validate;
      ctx.intake.solutionExists = true;
    }

    if (field === "persona") {
      if (!text) throw createError(400, "Text required for persona update");
      const personas = doc.personas || [];
      let targetPersona =
        personas.find((p) => p.id === personaId) ||
        personas.find((p) => p.id === doc.core.personaPrimaryId) ||
        personas[0];

      if (!targetPersona) {
        throw createError(400, "No persona available to update.");
      }

      targetPersona.description = text;
      targetPersona.updatedAt = new Date();
      targetPersona.updatedBy = userId;

      // also mark as primary selection
      doc.core.personaPrimaryId = targetPersona.id;
      doc.core.dirtyDownstream = true;
    }

    if (field === "persona_primary") {
      if (!personaId) throw createError(400, "Persona ID required for selection");
      const personas = doc.personas || [];
      const exists = personas.some((p) => p.id === personaId);
      if (!exists) throw createError(404, "Persona not found");

      doc.core.personaPrimaryId = personaId;
      doc.core.dirtyDownstream = true;

      // --- Trigger solution regeneration based on new persona (ASYNC) ---
      console.log(`🔄 Persona changed to ${personaId}. Regenerating solution (async)...`);

      // Invalidate solution with placeholder while background job runs
      doc.core.solution = doc.core.solution || {};
      doc.core.solution.state = "draft";
      doc.core.solution.text = "Avara is refining the solution for this persona...";

      doc.summary.solution = doc.summary.solution || {};
      doc.summary.solution.state = "unvalidated";
      doc.summary.solution.notes = "Avara is refining the solution for this persona...";

      ctx.intake.solutionValidated = false;

      // Save initial state and return response to reduce latency
      await doc.save();
      await ctx.save();

      // Trigger synthesis in background
      const primaryPersona = personas.find((p) => p.id === personaId);

      synthesizeDocument({
        intake: ctx.intake,
        sources: [],
        spa: doc.meta?.spa || null,
        mode: "refine_solution",
        core: {
          problem: doc.core.problem,
          solution: doc.core.solution,
          primaryPersona,
        },
      })
        .then(async (refinedRaw) => {
          try {
            console.log("Background synthesis complete for project:", projectId);
            const freshDoc = await ResearchDoc.findOne({ userId, projectId });
            if (!freshDoc) return;

            const refined = normalizeResearchDoc(refinedRaw, { projectId });

            if (refined.summary?.solution?.notes) {
              freshDoc.core = freshDoc.core || {};
              freshDoc.core.solution = freshDoc.core.solution || {};
              freshDoc.core.solution.text = refined.summary.solution.notes;

              freshDoc.summary = freshDoc.summary || {};
              freshDoc.summary.solution = freshDoc.summary.solution || {};
              freshDoc.summary.solution.notes = refined.summary.solution.notes;
              freshDoc.summary.solution.state =
                refined.summary.solution.state || "validated";
            }

            if (refined.sections?.length) {
              freshDoc.sections = mergeSections(
                freshDoc.sections,
                refined.sections
              );
            }

            await freshDoc.save();
            console.log("Background synthesis saved for project:", projectId);
          } catch (err) {
            console.error("Error in background synthesis:", err);
          }
        })
        .catch((err) => {
          console.error("Unhandled error in background synthesis promise:", err);
        });
    }

    // --- Re-evaluate gates based on updated intake ---
    const gate = decideValidation(ctx.intake || {});
    ctx.gates = ctx.gates || {};
    ctx.gates.problemValidationNeeded = gate.needProblem;
    ctx.gates.solutionValidationNeeded = gate.needSolution;

    // NOTE: We NO LONGER automatically lock core here. User must explicitly lock.
    await Promise.all([doc.save(), ctx.save()]);

    res.json({
      ok: true,
      doc,
      context: ctx,
    });
  } catch (err) {
    console.error("Error updating core triad:", err);
    next(err);
  }
};

// ---------------- LOCK CORE ----------------

export const lockCore = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const [doc, ctx] = await Promise.all([
      ResearchDoc.findOne({ userId, projectId }),
      ProjectContext.findOne({ userId, projectId }),
    ]);

    if (!doc) throw createError(404, "Research document not found");
    if (!ctx) throw createError(404, "Project context not found");

    // Validate that we have enough to lock
    if (!doc.core?.problem?.text || !doc.core?.solution?.text) {
      throw createError(400, "Cannot lock core without problem and solution.");
    }
    if (!doc.core?.personaPrimaryId) {
      throw createError(400, "Cannot lock core without a primary persona.");
    }

    // Lock it
    doc.core.locked = true;
    doc.core.problem.state = "validated";
    doc.core.solution.state = "validated";
    doc.summary.problem.state = "validated";
    doc.summary.solution.state = "validated";

    // Update intake context
    ctx.intake.problemValidated = true;
    ctx.intake.solutionValidated = true;

    console.log("🔒 Locking core and generating downstream analysis...");

    // Generate downstream
    const primaryPersona =
      (doc.personas || []).find(
        (p) => p.id === doc.core.personaPrimaryId
      ) || (doc.personas || [])[0] || null;

    const downstreamRaw = await synthesizeDocument({
      intake: ctx.intake,
      sources: [],
      spa: doc.meta?.spa || null,
      mode: "downstream",
      gtms: false,
      core: {
        problem: doc.core.problem || null,
        solution: doc.core.solution || null,
        primaryPersona,
      },
      region: ctx.intake?.region || null,
    });

    const downstream = normalizeResearchDoc(downstreamRaw, { projectId });

    // Ensure experiments always exist
    if (downstream.experiments?.length > 0) {
      doc.experiments = downstream.experiments;
    } else {
      doc.experiments = [
        {
          id: "exp_default",
          title: "Validate core assumptions",
          hypothesis: "The primary persona experiences the stated problem.",
          metric: "At least 10 qualitative confirmations.",
          status: "pending",
        },
      ];
    }

    if (downstream.competitors?.length) {
      doc.competitors = downstream.competitors;
    }
    if (downstream.timeline?.length) {
      doc.timeline = downstream.timeline;
    }
    if (downstream.analysis) {
      doc.analysis = {
        ...(doc.analysis || {}),
        ...downstream.analysis,
      };
    }
    doc.summary = {
      ...(doc.summary || {}),
      ...(downstream.summary || {}),
    };

    doc.core.dirtyDownstream = false;

    try {
      const reliability = await assessDocReliabilityWithHF({
        intake: ctx.intake,
        doc: doc.toObject ? doc.toObject() : doc,
      });
      if (reliability) {
        doc.meta = doc.meta || {};
        doc.meta.reliability = reliability;
      }
    } catch (critErr) {
      console.error(
        "HF critic failed after lockCore, keeping existing reliability:",
        critErr
      );
    }
    await Promise.all([doc.save(), ctx.save()]);

    res.json({
      ok: true,
      doc,
      context: ctx,
    });
  } catch (err) {
    console.error("Error locking core:", err);
    next(err);
  }
};

// ---------------- ADVANCE GATES ----------------

export const advanceGates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { approveExperiments, approveProceedToGTM } =
      advanceSchema.parse(req.body);

    const ctx = await ProjectContext.findOne({ userId, projectId });
    if (!ctx) throw createError(404, "Project not found");

    const doc = await ResearchDoc.findOne({ userId, projectId });
    if (!doc) throw createError(404, "Doc not found");

    if (approveExperiments) {
      console.log("✓ Approving experiments gate");
      ctx.gates = ctx.gates || {};
      ctx.gates.userApprovedExperiments = true;
      ctx.state = "validation";
      await ctx.save();

      await Project.findOneAndUpdate(
        { userId, projectId },
        { $set: { status: "validation", updatedAt: new Date() } }
      );
    }

    if (approveProceedToGTM === true) {
      console.log("Attempting GTM approval...");
      if (doc.summary?.solution?.state !== "validated") {
        console.log("Solution not validated:", doc.summary?.solution?.state);
        throw createError(400, "Cannot proceed to GTM: solution not validated");
      }

      ctx.gates = ctx.gates || {};
      ctx.gates.userApprovedProceedToGTM = true;
      ctx.state = "gtm_ready";
      await ctx.save();

      await Project.findOneAndUpdate(
        { userId, projectId },
        { $set: { status: "gtm_ready", updatedAt: new Date() } }
      );

      console.log("Generating GTM sections…");
      const primaryPersona =
        (doc.personas || []).find(
          (p) => p.id === doc.core?.personaPrimaryId
        ) || (doc.personas || [])[0] || null;

      const gtmdocRaw = await synthesizeDocument({
        intake: ctx.intake,
        sources: [],
        spa: doc.meta?.spa || null,
        mode: "downstream",
        gtms: true,
        core: {
          problem: doc.core?.problem || null,
          solution: doc.core?.solution || null,
          primaryPersona,
        },
        region: ctx.intake?.region || null,
      });

      console.log(
        "GTM AI returned:",
        gtmdocRaw.sections?.length || 0,
        "sections"
      );

      const gtmdoc = normalizeResearchDoc(gtmdocRaw, { projectId });

      doc.sections = mergeSections(doc.sections, gtmdoc.sections || []);
      doc.timeline = gtmdoc.timeline || doc.timeline;
      doc.analysis = {
        ...(doc.analysis || {}),
        ...(gtmdoc.analysis || {}),
      };
      doc.summary = {
        ...(doc.summary || {}),
        ...(gtmdoc.summary || {}),
        nextStep:
          gtmdoc.summary?.nextStep ||
          "Execute GTM plan & prepare Risk Agent handoff",
        etaDays: gtmdoc.summary?.etaDays ?? 60,
      };

      // ✅ Re-run HF reliability again once GTM is added
      try {
        const reliability = await assessDocReliabilityWithHF({
          intake: ctx.intake,
          doc: doc.toObject ? doc.toObject() : doc,
        });
        if (reliability) {
          doc.meta = doc.meta || {};
          doc.meta.reliability = reliability;
        }
      } catch (critErr) {
        console.error(
          "HF critic failed after GTM, keeping existing reliability:",
          critErr
        );
      }

      await doc.save();

      console.log("GTM sections merged and saved");
    }

    res.json({ ok: true, doc, context: ctx });
  } catch (err) {
    console.error("Error advancing gates:", err);
    next(err);
  }
};

// ---------------- CLARIFICATION HANDLING ----------------

// ---------- Clarifying answers ----------

export const submitClarification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length < 5) {
      throw createError(
        400,
        "Answer is required and must be at least 5 characters."
      );
    }

    const [doc, ctx] = await Promise.all([
      ResearchDoc.findOne({ userId, projectId }),
      ProjectContext.findOne({ userId, projectId }),
    ]);

    if (!doc) throw createError(404, "Research document not found");

    const trimmed = answer.trim();

    // Clear the "need more input" flag on the doc
    doc.meta = doc.meta || {};
    doc.meta.needMoreInput = false;

    // Store the answer in meta for record keeping
    doc.meta.clarificationAnswers = doc.meta.clarificationAnswers || [];
    doc.meta.clarificationAnswers.push({
      answer: trimmed,
      date: new Date(),
    });

    // 🔑 NEW: feed clarification into context intake as resource hint
    if (ctx) {
      ctx.intake = ctx.intake || {};
      const intake = ctx.intake;

      // If the user started problem-first but we asked about resource,
      // treat this answer as a resourceDescription hint.
      if (intake.pathType === "problem") {
        const current = (intake.resourceDescription || "").trim();

        if (!current) {
          // No resourceDescription yet → set directly
          intake.resourceDescription = trimmed;
        } else if (!current.includes(trimmed)) {
          // Already has something → append a short note
          intake.resourceDescription = `${current}\nClarification: ${trimmed}`;
        }

        ctx.intake = intake;
        ctx.markModified && ctx.markModified("intake");
      }

      await ctx.save();
    }

    doc.markModified("meta");
    await doc.save();

    res.json({ ok: true, doc, context: ctx });
  } catch (err) {
    console.error("Error submitting clarification:", err);
    next(err);
  }
};
