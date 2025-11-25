import express from "express";
import { requireUser } from "../middleware/auth.js";
import { analyseRisk, getRisks } from "../controllers/riskController.js";

const router = express.Router();

router.use(requireUser);

router.post("/analyse", analyseRisk)            ;

router.get("/:projectId", getRisks);

export default router;
