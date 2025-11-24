// services/hfInsights.js
import dotenv from "dotenv";
dotenv.config();

/**
 * Hugging Face config
 * -------------------
 * Must be set in .env for research-service:
 * HF_API_KEY=hf_...
 * HF_MODEL=meta-llama/Meta-Llama-3-8B-Instruct (or any other model)
 */

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Meta-Llama-3-8B-Instruct";
const HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";

function hfConfigured() {
  if (!HF_API_KEY) {
    console.warn(
      "[hfInsights] HF not fully configured – set HF_API_KEY to enable SPA/persona/competitor insights."
    );
    return false;
  }
  return true;
}

/**
 * Low-level HF call using Messages API (OpenAI-compatible)
 */
async function callHF(userPrompt, options = {}) {
  if (!hfConfigured()) {
    throw new Error("HF not configured");
  }

  const payload = {
    model: HF_MODEL,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    max_tokens: options.max_tokens || 512,
    temperature: options.temperature || 0.3,
  };

  const res = await fetch(HF_ROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `HF request failed: ${res.status} ${res.statusText} – ${text}`
    );
  }

  const json = await res.json();

  // Extract content from OpenAI-compatible response
  const content = json.choices?.[0]?.message?.content || "";
  return content;
}

/**
 * Safely parse JSON block from a text blob.
 */
function safeParseJsonFromText(text, label = "hfInsights") {
  try {
    const trimmed = text.trim();

    // If it already looks like pure JSON, just parse it
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }

    // Try to find first '{' and last '}' and parse that slice
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonPart = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonPart);
    }

    console.warn(
      `[${label}] Could not find JSON block in HF text, returning empty object. Raw:`,
      trimmed.slice(0, 200)
    );
    return {};
  } catch (err) {
    console.error(`[${label}] Failed to parse HF JSON:`, err);
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  SPA ANALYSIS / PERSONAS / COMPETITORS                             */
/* ------------------------------------------------------------------ */

/**
 * Ask HF to estimate SPA (Size, Pain, Access) and suggest clarifying questions.
 */
// ---------------- SPA + Clarifying Questions ----------------

async function analyzeSPAWithHF(intake) {
  if (!hfConfigured()) return {};

  const {
    industry,
    problem,
    solution,
    pathType,
    resourceDescription,
    region,
  } = intake || {};

  const prompt = `
You are an analytical startup advisor.

Context:
- Path type: ${pathType || "problem"}
- Industry: ${industry || "n/a"}
- Region: ${region || "n/a"}
- Problem statement: ${problem || "n/a"}
- Proposed solution (if any): ${solution || "n/a"}
- Core resource / material (if already known): ${resourceDescription || "n/a"}

Your job:

1) Evaluate the opportunity using SPA:
   - Size: how big is this opportunity likely to be?
   - Pain: how intense / urgent is the problem?
   - Accessibility: how reachable is the target buyer?

2) Score SPA from 0.0–1.0 each, and briefly explain *why*.

3) If the problem or resource description is vague, generic, or missing key details,
   suggest 2–4 clarifying questions the founder should answer next.

SPECIAL RULES FOR CLARIFYING QUESTIONS:

- For **problem-first** ideas (pathType = "problem"):
  * If the problem is broad like "sustainable textiles in Sri Lanka" or similar,
    you MUST ask:
      1) A niche question:
         "What specific niche or sub-segment are you targeting (e.g., export
          factories, local ethical brands, parents buying baby clothes)?"
      2) A resource question:
         "Are you planning to anchor this around a specific resource or material
          (e.g., lotus fibre, banana fibre, recycled PET)? If yes, which one?"

- For **resource-first** ideas (pathType = "resource"):
  * Focus questions on:
      - Which markets / customer types are best for this resource.
      - What specific problems this resource is meant to solve.

- Always make questions concrete and founder-friendly.
- 2–4 questions total is enough.

Return STRICT JSON only (no markdown, no explanation):
{
  "spa": {
    "sizeScore": 0.0,
    "painScore": 0.0,
    "accessibilityScore": 0.0,
    "commentary": "short commentary here"
  },
  "clarifyingQuestions": ["question 1", "question 2"]
}
`;

  const text = await callHF(prompt, {
    max_tokens: 512,
    temperature: 0.2,
  });

  const parsed = safeParseJsonFromText(text, "hfInsights-SPA");
  return parsed;
}

/**
 * Ask HF for persona suggestions.
 */
// ---------------- Personas (HF exploration) ----------------

async function suggestPersonasWithHF(intake) {
  if (!hfConfigured()) return [];

  const {
    industry,
    problem,
    solution,
    pathType,
    resourceDescription,
    region,
  } = intake || {};

  const isResource = pathType === "resource";

  const prompt = `
You are a senior market strategist helping a founder define concrete customer personas.

Context:
- Path type: ${pathType || "problem"}
- Industry: ${industry || "n/a"}
- Region / geography: ${region || "n/a"}
- Problem statement: ${problem || "n/a"}
- Proposed solution (if any): ${solution || "n/a"}
- Core resource / material (if any): ${resourceDescription || "n/a"}

GENERAL RULES:
- Avoid generic labels like "General Consumer" or "Everyone".
- Personas should feel like *real wedges* with clear budget and pain.
- All personas must be compatible with the context above (Sri Lanka, sustainable textiles, etc.).

PATH LOGIC:

${isResource
      ? `The founder is starting from a *resource-first* idea.

- Treat the resource as the hero. Think: "Given THIS material, who are the 3 best early markets?"
- Always output EXACTLY 3 personas that represent DISTINCT wedges:
  1) A B2B buyer (e.g., sourcing head, brand, manufacturer, retailer).
  2) A B2C/end-user persona (e.g., parent buying baby clothes, wellness consumer).
  3) A niche or future segment (e.g., spiritual / heritage garments, spa/wellness textiles).

- For each persona, explicitly tie their needs to THIS resource (e.g., lotus fibre) –
  softness, symbolism, low-impact, certifications, etc.`
      : `The founder is starting from a *problem-first* idea.

- Your job is to pick **up to 3** personas who:
  * strongly *feel* this problem in their daily work or life,
  * AND/OR control the budget or policy to solve it.

- At least one persona must be a clear **budget owner** (e.g., buyer, founder, manager).
- You may include at most one "ecosystem" persona (government, NGO, association).

- For broad problems like "Sri Lanka lacks sustainable textiles":
  * Think in terms of wedges such as:
    - Export factory / sourcing manager.
    - Local ethical brand founder.
    - Sri Lankan parent buying baby clothes.
    - Tourism / wellness operator needing low-impact textiles.`}

For EACH persona, return:
- id (string, slug-like, lowercase, words joined by underscores)
- type ("primary" | "secondary" | "future")
- title (short role/title, e.g., "Head of Sustainability at Export Apparel Factory")
- description (3–5 lines: what they do, their pain, and why this problem/resource matters)
- confidence (0–1 float, 2 decimal places)

Return STRICT JSON only (no markdown, no commentary):
{
  "personas": [
    {
      "id": "primary_export_sourcing_head",
      "type": "primary",
      "title": "Head of Sustainable Sourcing at Export Apparel Factory",
      "description": "…",
      "confidence": 0.87
    }
  ]
}
`;

  const text = await callHF(prompt, {
    max_tokens: 768,
    temperature: 0.4,
  });

  const parsed = safeParseJsonFromText(text, "hfInsights-Personas");
  return parsed.personas || [];
}


/**
 * Ask HF to suggest competitor landscape.
 * (Early scan – OpenAI synthesizer will later do PEST/SWOT + refined competitors
 *  once the core triad is fixed.)
 */
async function analyzeCompetitorsWithHF(intake) {
  if (!hfConfigured()) return [];

  const { industry, problem, solution, region } = intake || {};

  const prompt = `
You are mapping the competitor landscape for a startup.

Context:
- Industry: ${industry || "n/a"}
- Region / geography focus: ${region || "n/a"}
- Problem: ${problem || "n/a"}
- Solution: ${solution || "n/a"}

Task:
List 3–5 relevant competitors or adjacent products
(prefer examples that matter in this region when possible; global players are fine if relevant).
For each competitor, include:
- name
- positioning
- strengths
- weaknesses
- overlap (how it overlaps with this startup's proposed direction)

Return STRICT JSON only (no markdown, no explanation):
{
  "competitors": [
    {
      "name": "ExampleCo",
      "positioning": "What they are mainly known for",
      "strengths": "Strong brand, large install base",
      "weaknesses": "Slow to innovate in niche X",
      "overlap": "Overlaps on Y, but not on Z."
    }
  ]
}
`;

  const text = await callHF(prompt, {
    max_tokens: 768,
    temperature: 0.4,
  });

  const parsed = safeParseJsonFromText(text, "hfInsights-Competitors");
  return parsed.competitors || [];
}

/* ------------------------------------------------------------------ */
/*  PUBLIC API used by researchController                             */
/* ------------------------------------------------------------------ */

/**
 * Called from startResearch to enrich the intake & doc with HF signals.
 * It does NOT throw if HF fails – caller should treat missing fields as "no extra insight".
 *
 * NOTE: This returns SPA + personas + early competitor hints.
 * PEST / SWOT and the rest of the stack are produced later by the OpenAI synthesizer
 * once the core problem/solution/persona triad is stable.
 */
export async function enrichIntakeWithHF(intake) {
  try {
    if (!hfConfigured()) {
      return {
        spa: null,
        personas: [],
        competitors: [],
        clarifyingQuestions: [],
      };
    }

    const [spaResult, personas, competitors] = await Promise.all([
      analyzeSPAWithHF(intake),
      suggestPersonasWithHF(intake),
      analyzeCompetitorsWithHF(intake),
    ]);

    return {
      spa: spaResult.spa || null,
      personas: personas || [],
      competitors: competitors || [],
      clarifyingQuestions: spaResult.clarifyingQuestions || [],
    };
  } catch (err) {
    console.error("[hfInsights] Failed to enrich intake with HF:", err);
    return {
      spa: null,
      personas: [],
      competitors: [],
      clarifyingQuestions: [],
    };
  }
}

/**
 * Optional: reliability / auditability assessment.
 * Called from startResearch AFTER doc is normalized.
 * We often pass { intake, doc } as a single payload.
 */
export async function assessDocReliabilityWithHF(doc) {
  try {
    if (!hfConfigured()) {
      return null;
    }

    const prompt = `
You are assessing the reliability and risk of an AI-generated startup research pack.

The document (JSON) is:
${JSON.stringify(doc).slice(0, 8000)}

Task:
Evaluate:
- reliabilityScore: float 0–1 (overall trust)
- concerns: array of short strings (e.g. "Assumes TAM without citing sources")
- recommendedChecks: array of short strings the founder should do manually
- versionTag: short string they can log (e.g. "hf-check-v1")

Return STRICT JSON only (no markdown, no explanation):
{
  "reliabilityScore": 0.0,
  "concerns": ["..."],
  "recommendedChecks": ["..."],
  "versionTag": "..."
}
`;

    const text = await callHF(prompt, {
      max_tokens: 768,
      temperature: 0.2,
    });

    console.log("[hfInsights] Reliability raw response:", text);

    const parsed = safeParseJsonFromText(text, "hfInsights-Reliability");
    console.log("[hfInsights] Reliability parsed:", parsed);
    return parsed;
  } catch (err) {
    console.error("[hfInsights] assessDocReliabilityWithHF failed:", err);
    return null;
  }
}
