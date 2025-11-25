// services/roadmap-service/routes/roadmapRoutes.js
import express from "express";
import { requireUser } from "../middleware/auth.js";
import {
  generateRoadmap,
  getRoadmap,
} from "../controllers/roadmapController.js";

const router = express.Router();

router.use(requireUser);

// POST /roadmap/generate
router.post("/generate", generateRoadmap);

// GET /roadmap/:projectId
router.get("/:projectId", getRoadmap);

export default router;
