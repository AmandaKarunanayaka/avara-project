// services/chat-service/services/chatPatchIntake.js
import { getOpenAI, MODELS } from "../../research-service/services/openai.js";

export async function chatPatchIntake({ ctx, message }) {
  if (process.env.USE_LLM === "false") {
    const current = ctx.intake?.progressBrief || "";
    return {
      patch: {
        intake: {
          progressBrief: `${current}\nUser note: ${message}`,
        },
        meta: {
          readyForResearch: false,
          needMoreInput: true,
          clarifyingQuestions: [
            "Please describe your target user more clearly.",
          ],
        },
        state: "draft",
      },
      reply:
        "LLM is disabled; I added this as a note to your intake. Once LLM is enabled, I can help refine it further.",
    };
  }

  const system = `
You are Avara Assistant in INTAKE mode.
Your job is to help the founder improve their intake (problem, niche, solution) BEFORE deep research is generated.

You receive:
{
  "context": {
    "intake": { ... },
    "meta": {
      "needMoreInput": boolean,
      "readyForResearch": boolean,
      "clarifyingQuestions": string[] | undefined
    }
  },
  "message": "user's latest answer or question"
}

Your goals:
- Be a pragmatic cofounder.
- Ask focused, high-signal questions about:
  - target users / niche
  - specific problem
  - proposed solution
- Gently reject low-signal replies like "everyone" or "just make it big".
- Explain consequences of broad/vague positioning.
- Decide when we have "enough" to generate a research pack.

When you think the intake is still weak:
- keep meta.readyForResearch = false
- meta.needMoreInput = true
- add or update meta.clarifyingQuestions with 1–3 next questions (short and concrete).

When you think we have enough:
- meta.readyForResearch = true
- meta.needMoreInput = false
- meta.clarifyingQuestions can be empty or contain optional refinements.
- state = "research_ready".

Do NOT invent detailed market sizes or statistics.
Keep your language straightforward and founder-friendly.

Return STRICT JSON:
{
  "patch": {
    "intake": {
      // optional partial update to ctx.intake
    },
    "meta": {
      "readyForResearch": boolean,
      "needMoreInput": boolean,
      "clarifyingQuestions": string[]
    },
    "state": "draft" | "research_ready"
  },
  "reply": "short chat reply, 2-5 sentences, explaining what you understood and what you suggest next"
}
`;

  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: MODELS.PLANNER,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          context: {
            intake: ctx.intake || {},
            meta: ctx.meta || {},
          },
          message,
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  let result;
  try {
    result = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    console.error("chatPatchIntake JSON parse error:", e);
    result = {};
  }

  const patch = result.patch || {};
  const reply =
    result.reply ||
    "Got it. I’ve updated your intake and will keep asking focused questions until we’re ready for research.";

  // Safety defaults
  if (!patch.meta) {
    patch.meta = {
      readyForResearch: false,
      needMoreInput: true,
      clarifyingQuestions: [],
    };
  }

  if (!patch.state) {
    patch.state = patch.meta.readyForResearch ? "research_ready" : "draft";
  }

  return { patch, reply };
}
