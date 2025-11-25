// services/risk-service/controllers/riskController.js
import createError from "http-errors";
import { z } from "zod";
import RiskDoc from "../models/RiskDoc.js";
import ResearchDoc from "../models/ResearchDoc.js";
import { synthesizeRisks } from "../services/riskSynthesizer.js";

const analyseSchema = z.object({
    projectId: z.string().min(1),
    scope: z.enum(["problem", "core", "gtm"]),
});

export const analyseRisk = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { projectId, scope } = analyseSchema.parse(req.body);

        const researchDoc = await ResearchDoc.findOne({ userId, projectId });
        if (!researchDoc) {
            throw createError(404, "Research document not found");
        }

        // Synthesize risks from full research doc
        const result = await synthesizeRisks({
            scope,
            researchDoc: researchDoc.toObject(),
        });

        const riskDoc =
            (await RiskDoc.findOne({ userId, projectId })) ||
            new RiskDoc({ userId, projectId });

        if (scope === "problem") {
            riskDoc.problemRisks = result.risks || [];
        }
        if (scope === "core") {
            riskDoc.coreRisks = result.risks || [];
        }
        if (scope === "gtm") {
            riskDoc.gtmRisks = result.risks || [];
        }
        riskDoc.summary = result.summary || riskDoc.summary;

        await riskDoc.save();

        res.json({
            ok: true,
            scope,
            summary: riskDoc.summary,
            risks:
                scope === "problem"
                    ? riskDoc.problemRisks
                    : scope === "core"
                        ? riskDoc.coreRisks
                        : riskDoc.gtmRisks,
        });
    } catch (err) {
        console.error("Error in analyseRisk:", err);
        next(err);
    }
};

export const getRisks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;

        const riskDoc = await RiskDoc.findOne({ userId, projectId });
        if (!riskDoc) {
            return res.json({
                ok: true,
                summary: "",
                problemRisks: [],
                coreRisks: [],
                gtmRisks: [],
            });
        }

        res.json({
            ok: true,
            summary: riskDoc.summary,
            problemRisks: riskDoc.problemRisks,
            coreRisks: riskDoc.coreRisks,
            gtmRisks: riskDoc.gtmRisks,
        });
    } catch (err) {
        console.error("Error in getRisks:", err);
        next(err);
    }
};
