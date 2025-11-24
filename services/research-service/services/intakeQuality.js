// research-service/services/intakeQuality.js
import { getOpenAI, MODELS } from "./openai.js";

export async function assessIntakeQuality(intake) {
  const problem = intake.problem?.trim() || "";
  const solution = intake.solution?.trim() || "";
  const industry = intake.industry?.trim() || "";
  const region = intake.region?.trim() || "";

  // Very simple rules
  let isWeak = false;
  const ruleQuestions = [];

  // 1) Industry too vague / missing
  if (!industry || industry.length < 3) {
    isWeak = true;
    ruleQuestions.push(
      "Which specific industry or sub-sector are you focusing on? (e.g. 'B2B SaaS for logistics', 'D2C sustainable fashion')"
    );
  }

  // 2) Region / geography missing – needed for PEST + competitor scan later
  if (!region || region.length < 2) {
    isWeak = true;
    ruleQuestions.push(
      "Which country or region are you mainly targeting first? (e.g. 'Sri Lanka', 'UK', 'Colombo urban area')"
    );
  }

  // 3) Problem is short / vague
  if (!problem || problem.length < 10) {
    isWeak = true;
    ruleQuestions.push(
      "Can you describe the main problem your target users face in more detail?"
    );
  }

  // 4) Solution: we still ask, but it's okay if founder doesn't have one yet.
  if (!solution || solution.length < 10) {
    isWeak = true;
    ruleQuestions.push(
      "Do you already have a proposed solution in mind?"
    );
  }

  // 5) Niche / segment – we ALWAYS care about this if problem is weak.
  ruleQuestions.push(
    "Within your industry and region, which specific niche or segment are you most interested in? (e.g. 'busy university students in Colombo', 'small retail shops in Galle Road')"
  );

  // If we don't use LLM, return rule-based result
  if (process.env.USE_LLM === "false") {
    return {
      isWeak,
      clarifyingQuestions: ruleQuestions,
    };
  }

  // If rules say it's already strong, we can skip LLM
  if (!isWeak) {
    return { isWeak: false, clarifyingQuestions: [] };
  }

  // Use LLM to refine / add better questions
  try {
    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model: MODELS.PLANNER,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are Avara Assistant, a pragmatic cofounder.
Given an early-stage startup intake, you must decide what clarifying questions
to ask BEFORE doing deep research.

Return STRICT JSON:
{
  "clarifyingQuestions": ["question 1", "question 2", ...]
}

Questions should:
- Be specific and high-signal.
- Focus on target user, niche/segment, region/market, problem details, and solution shape.
- Avoid generic startup advice like "validate with customers".
- You may reuse or sharpen the provided "ruleQuestions" and add 1–3 new ones if needed.
        `.trim(),
        },
        {
          role: "user",
          content: JSON.stringify({ intake, ruleQuestions }),
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content || "{}";
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = {};
    }

    const clarifyingQuestions = Array.isArray(result.clarifyingQuestions)
      ? result.clarifyingQuestions
      : ruleQuestions;

    return {
      isWeak: true,
      clarifyingQuestions: clarifyingQuestions.length
        ? clarifyingQuestions
        : ruleQuestions,
    };
  } catch (err) {
    console.error("assessIntakeQuality LLM error, falling back to rules:", err);
    return {
      isWeak,
      clarifyingQuestions: ruleQuestions,
    };
  }
}
