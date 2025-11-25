// services/task-service/routes/taskRoutes.js
import express from "express";
import { requireUser } from "../middleware/auth.js";
import { generateTasks, getTasks } from "../controllers/taskController.js";

const router = express.Router();

router.use(requireUser);

// POST /tasks/generate
router.post("/generate", generateTasks);

// GET /tasks/:projectId
router.get("/:projectId", getTasks);

export default router;
