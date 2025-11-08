import { Router } from "express";
import { chatWithAgent } from "../controllers/chatController.js";

const r = Router();
r.post("/:projectId", chatWithAgent);

export default r;
