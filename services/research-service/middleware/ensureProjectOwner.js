import Project from "../models/Project.js";

export async function ensureProjectOwner(req, res, next) {
  try {
    const userId = req.user.id;
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: "projectId required" });

    const found = await Project.findOne({ userId, projectId }).lean();
    if (!found) return res.status(404).json({ error: "Project not found for this user" });

    return next();
  } catch (e) {
    return res.status(500).json({ error: "Failed to verify project ownership" });
  }
}
