import { getOpenAI, MODELS } from "./openai.js";

export async function chatPatchDoc({ doc, message }) {
  if (process.env.USE_LLM === "false") {
    return { patch: { summary: { ...doc.summary, nextStep: `User note: ${message}` } } };
  }

  const system = `
You are the same research agent that produced the document.
User will ask for changes/clarifications. Return JSON:
{"patch":{"summary":{...optional...},"sections":[{"id":"...","html":"..."}]}}`;

  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: MODELS.PLANNER,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify({ doc, message }) }
    ],
    response_format: { type: "json_object" }
  });
  return JSON.parse(resp.choices[0].message.content);
}
