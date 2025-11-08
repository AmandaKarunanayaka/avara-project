import ResearchDoc from "../models/ResearchDoc.js";
import { chatPatchDoc } from "../services/chatPatch.js";

export const chatWithAgent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    const doc = await ResearchDoc.findOne({ projectId });
    if (!doc) return res.status(404).json({ error: "Doc not found" });

    const result = await chatPatchDoc({ doc, message });

    if (result.patch?.summary) {
      doc.summary = { ...doc.summary.toObject?.() ?? doc.summary, ...result.patch.summary };
    }
    if (Array.isArray(result.patch?.sections)) {
      for (const upd of result.patch.sections) {
        const idx = doc.sections.findIndex(s => s.id === upd.id);
        if (idx >= 0) doc.sections[idx].html = upd.html;
        else doc.sections.push(upd);
      }
    }
    await doc.save();
    res.json({ ok: true, doc });
  } catch (err) {
    next(err);
  }
};
