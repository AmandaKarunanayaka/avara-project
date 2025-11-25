import { getOpenAI, MODELS } from "./openai.js";

export async function synthesizeTasks({ researchDoc }) {
  const openai = getOpenAI();

  const systemPrompt = `
You are the "Task Agent" of a startup acceleration platform.

You receive researchDoc with:
- problem, solution, persona, SPA
- main pains and jobs
- competitor summary
- PEST/SWOT
- experiments / suggested actions
- GTM direction (if present)

Goal:
Generate a concise, actionable task list for the next 4–8 weeks. Think like a founder with a tiny team.

Rules:
- Derive tasks from what the research is already suggesting (validation, experiments, GTM prep).
- Do NOT invent a random new strategy.
- Each task must be small enough to complete in a few days.
- Each task:
  - id (string)
  - title (short)
  - description (1–2 sentences)
  - category: "research" | "validation" | "product" | "gtm" | "ops"
  - status: "todo" (initially)
  - priority: "low" | "medium" | "high"
  - dueInDays: integer (approx days from today)

Output STRICT JSON:
{
  "tasks": [
    {
      "id": "task_1",
      "title": "Interview 5 early adopters",
      "description": "Recruit and interview 5 people from the primary segment to validate the core problem and solution.",
      "category": "validation",
      "status": "todo",
      "priority": "high",
      "dueInDays": 7
    }
  ]
}
  `.trim();

  const payload = { researchDoc };

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
    console.error("[tasks] Failed to parse taskSynth JSON:", err);
    return { tasks: [] };
  }
}
