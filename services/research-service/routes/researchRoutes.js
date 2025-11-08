import { Router } from "express";
import { startResearch, getResearchDoc, advanceGates } from "../controllers/researchController.js";

const r = Router();
r.post("/start", startResearch);
r.get("/:projectId", getResearchDoc);
r.post("/advance", advanceGates); // <-- Postman: approve gates

export default r;
