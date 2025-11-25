import { getOpenAI, MODELS } from "./openai.js";

export async function synthesizeRisks({ scope, researchDoc }) {
  const openai = getOpenAI();

  const systemPrompt = `
You are the "Risk Agent" for a startup acceleration platform.

You receive:
- researchDoc: the full research output for this project
  (core problem/solution/persona, SWOT, PEST, GTM summary, timeline, experiments, etc.)
- scope: "problem" | "core" | "gtm"

Your job:
- Extract and structure the most important risks for the current scope.
- You must score each risk with:
  - impact (1–5)
  - likelihood (1–5)
  - severity ("low" | "medium" | "high")
- Propose a concise mitigation for each risk.

Rules:
- If scope = "problem":
  - Focus on risks that the problem is not real, not painful enough, or not big enough.
  - Use evidence from PEST, SWOT, personas, and any "problem validation" sections.
- If scope = "core":
  - Focus on risks in solution, business model, segment choice, differentiation vs competitors.
- If scope = "gtm":
  - Focus on risks in GTM strategy, channels, CAC/LTV uncertainty, dependency on a single platform.
  - Look specifically at 'summary.gtm' and any GTM-related sections.

Output STRICT JSON:
{
  "summary": "One paragraph summary of the main risk profile for this scope.",
  "risks": [
    {
      "id": "risk_1",
      "title": "Short title",
      "description": "2–3 sentences describing the risk.",
      "category": "Market | Technical | GTM | Operational | Financial | Team | Other",
      "impact": 3,
      "likelihood": 4,
      "severity": "high",
      "mitigation": "1–3 sentence mitigation plan.",
      "scope": "problem" | "core" | "gtm",
      "sourceHint": "e.g. SWOT threats, GTM summary, experiments, etc."
    }
  ]
}
`;

  const payload = {
    scope,
    researchDoc,
  };

  const resp = await openai.chat.completions.create({
    model: MODELS.SYNTH || "gpt-4o-mini",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const content = resp.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse riskSynth JSON:", err);
    return { summary: "", risks: [] };
  }
}
