import createError from "http-errors";
import { z } from "zod";
import RoadmapDoc from "../models/RoadmapDoc.js";
import ResearchDoc from "../models/ResearchDoc.js";
import { synthesizeRoadmap } from "../services/roadmapSynthesizer.js";

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

export const generateRoadmap = async (req, res, next) => {
  try {
    const { projectId } = generateSchema.parse(req.body);
    const userId = getUserId(req);

    console.log("[roadmap] generateRoadmap called", { projectId, userId });

    const researchQuery = buildQuery(projectId, userId);
    const researchDoc = await ResearchDoc.findOne(researchQuery);

    if (!researchDoc) {
      console.warn("[roadmap] No ResearchDoc found for", researchQuery);
      throw createError(404, "Research document not found");
    }

    const result = await synthesizeRoadmap({
      researchDoc: researchDoc.toObject(),
    });

    let roadmapDoc = await RoadmapDoc.findOne(
      buildQuery(projectId, userId || researchDoc.userId)
    );

    if (!roadmapDoc) {
      roadmapDoc = new RoadmapDoc({
        projectId,
        userId: userId || researchDoc.userId || "unknown",
      });
    }

    roadmapDoc.horizonMonths = result.horizonMonths || 6;
    roadmapDoc.overarchingGoal = result.overarchingGoal || "";
    roadmapDoc.summary = result.summary || "";
    roadmapDoc.phases = result.phases || [];

    await roadmapDoc.save();

    return res.json({
      ok: true,
      roadmap: roadmapDoc,
    });
  } catch (err) {
    console.error("[roadmap] Error in generateRoadmap:", err);
    next(err);
  }
};

export const getRoadmap = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = getUserId(req);

    const roadmapDoc = await RoadmapDoc.findOne(buildQuery(projectId, userId));

    if (!roadmapDoc) {
      return res.json({
        ok: true,
        roadmap: null,
      });
    }

    return res.json({
      ok: true,
      roadmap: roadmapDoc,
    });
  } catch (err) {
    console.error("[roadmap] Error in getRoadmap:", err);
    next(err);
  }
};
