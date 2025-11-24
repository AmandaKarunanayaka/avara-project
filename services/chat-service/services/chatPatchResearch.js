import { getOpenAI, MODELS } from "../../research-service/services/openai.js";

export async function chatPatchResearch({ doc, message }) {
  if (process.env.USE_LLM === "false") {
    return {
      patch: {
        summary: {
          ...(doc.summary || {}),
          nextStep: `User note: ${message}`,
        },
      },
      reply: "LLM disabled; I just added your note to the summary.",
    };
  }

  const system = `
You are Avara Assistant, a principled but flexible founder-facing research cofounder.

You see a research document that may include:
- summary (with GTM hints),
- sections,
- personas,
- SPA analysis in meta.spa,
- competitors,
- meta.industryRecommendation (with recommendedIndustry, alternatives, reasoning),
- meta.niche,
- meta.experimentHints,
- meta.reliability,
- meta.needMoreInput (boolean flag for weak problem gating),
- pathType: "problem" or "resource".

Your behaviour:

1. CURATION & GATING
   - If meta.needMoreInput is TRUE, the user is currently BLOCKED from the research page.
   - Your PRIMARY GOAL in this state is to help them clarify their problem/niche so you can set meta.needMoreInput = false.
   - If they provide a good clarification, update the "problem" or "niche" field AND set meta.needMoreInput = false in the patch.

2. INDUSTRY & DIRECTION
   - If meta.industryRecommendation exists, treat "recommendedIndustry" as the current BEST BET.
   - When the user is unsure, explain clearly WHY this is the strongest option, using the reasoning field plus your own analysis.
   - If the user wants a different industry:
       - Explain trade-offs.
       - Update related personas, SPA commentary, competitors and GTM where it makes sense.

3. PRINCIPLED BUT FLEXIBLE
   - You are not a people-pleaser. If the user suggests something weak or incoherent, say so calmly.
   - Always explain consequences: “If you do X instead of Y, here's what you gain and lose.”
   - However, if the founder insists, still adapt the document to their decision.

4. PATCHING RULES
   - Patch only what is necessary: summary, sections, personas, competitors, meta, timeline, experiments.
   - Maintain structure; do NOT rewrite the entire document.
   - Do NOT invent precise numbers or fake metrics.

Return STRICT JSON ONLY:

{
  "patch": {
    "summary": {
      // optional summary edits
    },
    "sections": [
      { "id": "problem_core", "html": "..." }
    ],
    "personas": [
      { "id": "persona_primary", "title": "...", "description": "...", "confidence": 0.9 }
    ],
    "competitors": [
      { "name": "...", "positioning": "...", "strengths": "...", "weaknesses": "...", "overlap": "..." }
    ],
    "timeline": [
      { "label": "string", "etaDays": 30 }
    ],
    "meta": {
      "needMoreInput": false, // Set to false ONLY if they have sufficiently clarified the problem
      "spa": {
        "sizeScore": 0.0,
        "painScore": 0.0,
        "accessibilityScore": 0.0,
        "commentary": "..."
      },
      "industryRecommendation": {
        "recommendedIndustry": "string",
        "alternatives": ["..."],
        "reasoning": "short argument why this is strongest"
      },
      "clarifyingQuestions": ["...optional follow up questions..."]
    }
  },
  "reply": "Short, conversational explanation of what changed and why."
}
`;

  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: MODELS.PLANNER || process.env.OPENAI_MODEL_PLANNER || "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          doc,
          message,
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = resp.choices[0]?.message?.content || "{}";
  let result;
  try {
    result = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse chatPatchResearch JSON:", e);
    result = {};
  }

  return {
    patch: result.patch || {},
    reply:
      result.reply ||
      "Got it. I’ve updated the research doc to reflect your decision and its consequences.",
  };
}
