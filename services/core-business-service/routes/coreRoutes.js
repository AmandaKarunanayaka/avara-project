// services/core-business-service/routes/coreRoutes.js
import express from "express";
import { requireUser } from "../middleware/auth.js";
import { generateCore, getCore } from "../controllers/coreController.js";

const router = express.Router();

router.use(requireUser);

// POST /core/generate
router.post("/generate", generateCore);

// GET /core/:projectId
router.get("/:projectId", getCore);

export default router;
