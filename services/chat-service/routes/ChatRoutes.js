import { Router } from "express";
import { chatWithAgent } from "../controllers/chatController.js";
import { requireUser } from "../../research-service/middleware/auth.js";

const router = Router();


router.post("/:service/:projectId", requireUser, chatWithAgent);

export default router;
