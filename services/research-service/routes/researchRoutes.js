import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { ensureProjectOwner } from "../middleware/ensureProjectOwner.js";
import { startResearch, getResearchDoc, advanceGates } from "../controllers/researchController.js";

const router = Router();

router.post("/", requireUser, startResearch);
router.get("/:projectId", requireUser, ensureProjectOwner, getResearchDoc);
router.post("/advance", requireUser, ensureProjectOwner, advanceGates);

export default router;
