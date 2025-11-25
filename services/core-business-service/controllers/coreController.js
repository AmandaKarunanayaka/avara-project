// services/core-business-service/controllers/coreController.js
import createError from "http-errors";
import { z } from "zod";
import CoreDoc from "../models/coreDoc.js";
import ResearchDoc from "../models/ResearchDoc.js";
import { synthesizeCore } from "../services/coreSynthesizer.js";

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

export const generateCore = async (req, res, next) => {
  try {
    const { projectId } = generateSchema.parse(req.body);
    const userId = getUserId(req);

    console.log("[core] generateCore called", { projectId, userId });

    const researchQuery = buildQuery(projectId, userId);
    const researchDoc = await ResearchDoc.findOne(researchQuery);

    if (!researchDoc) {
      console.warn("[core] No ResearchDoc found for", researchQuery);
      throw createError(404, "Research document not found");
    }

    const result = await synthesizeCore({
      researchDoc: researchDoc.toObject(),
    });

    let coreDoc = await CoreDoc.findOne(
      buildQuery(projectId, userId || researchDoc.userId)
    );

    if (!coreDoc) {
      coreDoc = new CoreDoc({
        projectId,
        userId: userId || researchDoc.userId || "unknown",
      });
    }

    coreDoc.purpose = result.purpose || "";
    coreDoc.mission = result.mission || "";
    coreDoc.vision = result.vision || "";
    coreDoc.strategicFocus = result.strategicFocus || "";
    coreDoc.brandValues = result.brandValues || [];
    coreDoc.tagline = result.tagline || "";

    await coreDoc.save();

    return res.json({
      ok: true,
      core: coreDoc,
    });
  } catch (err) {
    console.error("[core] Error in generateCore:", err);
    next(err);
  }
};

export const getCore = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = getUserId(req);

    const coreDoc = await CoreDoc.findOne(buildQuery(projectId, userId));

    if (!coreDoc) {
      return res.json({
        ok: true,
        core: null,
      });
    }

    return res.json({
      ok: true,
      core: coreDoc,
    });
  } catch (err) {
    console.error("[core] Error in getCore:", err);
    next(err);
  }
};
