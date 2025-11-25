// services/research-service/routes/researchRoutes.js
import express from "express";
import {
  startResearch,
  getResearchDoc,
  saveIntakeDraft,
  getIntakeDraft,
  updateCore,
  lockCore,
  advanceGates,
  submitClarification,
} from "../controllers/researchController.js";
import { requireUser } from "../middleware/auth.js";

const router = express.Router();

// Protect all research routes
router.use(requireUser);

/**
 * Intake wizard / start research
 * POST /research/start
 */
router.post("/start", startResearch);

/**
 * Intake draft
 * POST /research/draft
 * GET  /research/:projectId/draft
 */
router.post("/draft", saveIntakeDraft);
router.get("/:projectId/draft", getIntakeDraft);

/**
 * Main research document
 * GET /research/:projectId
 *   – used by Research.tsx -> fetch(`.../research/${projectId}`)
 */
router.get("/:projectId", getResearchDoc);

/**
 * Core triad updates (problem, solution, persona, persona_primary)
 * PUT /research/core
 *   – used by Research.tsx for core edits + persona selection
 */
router.put("/core", updateCore);

/**
 * Lock core & generate downstream PEST/SWOT/experiments/timeline
 * POST /research/:projectId/lock
 *   – "Lock core first" step
 */
router.post("/:projectId/lock", lockCore);

/**
 * Advance gates (experiments approved, proceed to GTM)
 * POST /research/:projectId/gate
 *   – used by Research.tsx -> /research/${projectId}/gate
 */
router.post("/:projectId/gate", advanceGates);

/**
 * Clarifying questions answers
 * POST /research/:projectId/clarify
 *   – used by Research.tsx -> /research/${projectId}/clarify
 */
router.post("/:projectId/clarify", submitClarification);

export default router;
