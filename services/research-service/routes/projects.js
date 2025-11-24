import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import Project from "../models/Project.js";

const router = Router();

router.post("/", requireUser, async (req, res) => {
  const { projectId, name, industry } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ error: "projectId & name required" });
  }

  const proj = await Project.findOneAndUpdate(
    { userId: req.user.id, projectId },
    {
      userId: req.user.id,
      projectId,
      name,
      industry: industry || "",
      status: "draft",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(proj);
});

router.get("/", requireUser, async (req, res) => {
  const items = await Project.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(items);
});

export default router;
