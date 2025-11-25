// services/core-business-service/services/coreSynthesizer.js
import { getOpenAI, MODELS } from "./openai.js";

export async function synthesizeCore({ researchDoc }) {
  const openai = getOpenAI();

  const systemPrompt = `
You are the "Business Core Agent" of a startup acceleration platform.

You receive a full research document for a project, including:
- validated problem statement (if available)
- solution summary
- primary target persona & segment
- SPA scores (size, pain, accessibility, confidence)
- market summary
- main pain points
- top competitors
- any early GTM direction

Your job:
Using only this context, define a coherent "business core" for the startup:
- purpose: why this exists beyond profit (2–3 sentences)
- mission: what we do + for whom (1–2 sentences)
- vision: what the world looks like if we win (2–3 sentences)
- strategicFocus: who we serve first, what value we promise, and how we differ (1 short paragraph)
Optionally:
- brandValues: 3–5 simple value words/phrases
- tagline: a short internal tagline (not marketing slogan, but clear internal anchor).

Output STRICT JSON:
{
  "purpose": "...",
  "mission": "...",
  "vision": "...",
  "strategicFocus": "...",
  "brandValues": ["...", "..."],
  "tagline": "..."
}
  `.trim();

  const payload = {
    researchDoc,
  };

  const resp = await openai.chat.completions.create({
    model: MODELS.SYNTH || "gpt-4o-mini",
    temperature: 0.3,
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
    console.error("[core] Failed to parse coreSynth JSON:", err);
    return {
      purpose: "",
      mission: "",
      vision: "",
      strategicFocus: "",
      brandValues: [],
      tagline: "",
    };
  }
}
