// services/task-service/controllers/taskController.js
import createError from "http-errors";
import { z } from "zod";
import TaskDoc from "../models/TaskDoc.js";
import ResearchDoc from "../models/ResearchDoc.js";
import { synthesizeTasks } from "../services/taskSynthesizer.js";

const generateSchema = z.object({
  projectId: z.string().min(1),
});

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?._id ||
    (req.user?.user && (req.user.user.id || req.user.user._id)) ||
    undefined
  );
}

function buildQuery(projectId, userId) {
  return userId ? { projectId, userId } : { projectId };
}

export const generateTasks = async (req, res, next) => {
  try {
    const { projectId } = generateSchema.parse(req.body);
    const userId = getUserId(req);

    console.log("[tasks] generateTasks called", { projectId, userId });

    const researchQuery = buildQuery(projectId, userId);
    const researchDoc = await ResearchDoc.findOne(researchQuery);

    if (!researchDoc) {
      console.warn("[tasks] No ResearchDoc found for", researchQuery);
      throw createError(404, "Research document not found");
    }

    const result = await synthesizeTasks({
      researchDoc: researchDoc.toObject(),
    });

    const tasks = Array.isArray(result.tasks) ? result.tasks : [];

    let taskDoc = await TaskDoc.findOne(
      buildQuery(projectId, userId || researchDoc.userId)
    );

    if (!taskDoc) {
      taskDoc = new TaskDoc({
        projectId,
        userId: userId || researchDoc.userId || "unknown",
        tasks: [],
      });
    }

    taskDoc.tasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category || "other",
      status: t.status || "todo",
      priority: t.priority || "medium",
      dueInDays:
        typeof t.dueInDays === "number" ? Math.max(0, t.dueInDays) : undefined,
    }));

    await taskDoc.save();

    return res.json({
      ok: true,
      tasks: taskDoc.tasks,
    });
  } catch (err) {
    console.error("[tasks] Error in generateTasks:", err);
    next(err);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = getUserId(req);

    const taskDoc = await TaskDoc.findOne(buildQuery(projectId, userId));

    if (!taskDoc) {
      return res.json({
        ok: true,
        tasks: [],
      });
    }

    return res.json({
      ok: true,
      tasks: taskDoc.tasks || [],
    });
  } catch (err) {
    console.error("[tasks] Error in getTasks:", err);
    next(err);
  }
};
