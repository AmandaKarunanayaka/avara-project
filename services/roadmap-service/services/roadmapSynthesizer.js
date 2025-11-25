// services/roadmap-service/services/roadmapSynthesizer.js
import { getOpenAI, MODELS } from "./openai.js";

export async function synthesizeRoadmap({ researchDoc }) {
  const openai = getOpenAI();

  const systemPrompt = `
You are the "Roadmap Agent" for a startup acceleration platform.

You receive a researchDoc for a project containing:
- validated problem & solution
- primary persona/segment
- SPA scores
- competitors, PEST, SWOT
- suggested experiments and early GTM direction (if any)

Goal:
Create a 3–4 phase execution roadmap over 6–12 months:
- Each phase:
  - id (string)
  - name (string)
  - order (1..N)
  - durationWeeks (integer)
  - objective (1–2 sentences)
  - keyResult (1 measurable outcome)
  - 3–6 milestones:
    - id (string)
    - title
    - description (1–2 sentences)
    - metric (how we know it's done)
    - dueOffsetWeeks (integer, weeks from phase start)
    - status ("todo" | "in_progress" | "done") – default "todo"
    - priority ("low" | "medium" | "high")

Output STRICT JSON:
{
  "horizonMonths": 6,
  "overarchingGoal": "...",
  "summary": "...",
  "phases": [
    {
      "id": "phase_1",
      "name": "Problem & Solution Validation",
      "order": 1,
      "durationWeeks": 4,
      "objective": "...",
      "keyResult": "...",
      "milestones": [
        {
          "id": "m1",
          "title": "...",
          "description": "...",
          "metric": "...",
          "dueOffsetWeeks": 2,
          "status": "todo",
          "priority": "high"
        }
      ]
    }
  ]
}
  `.trim();

  const payload = { researchDoc };

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
    console.error("[roadmap] Failed to parse roadmapSynth JSON:", err);
    return {
      horizonMonths: 6,
      overarchingGoal: "",
      summary: "",
      phases: [],
    };
  }
}
