// services/research-service/services/normalizeDoc.js

/**
 * Normalize the raw LLM response into a shape that matches ResearchDocSchema.
 */
export function normalizeResearchDoc(input, { projectId }) {
  const summaryIn = input?.summary || {};
  const probIn = summaryIn.problem || {};
  const solIn = summaryIn.solution || {};
  const gtmIn = summaryIn.gtm || {};

  const summary = {
    problem: {
      state: strOneOf(
        probIn.state,
        ["validated", "unvalidated", "unclear", "none"],
        "unclear"
      ),
      notes: (probIn.notes || "").toString(),
    },
    solution: {
      state: strOneOf(
        solIn.state,
        ["validated", "unvalidated", "none", "unclear"],
        "none"
      ),
      notes: (solIn.notes || "").toString(),
    },
    nextStep: (
      summaryIn.nextStep ||
      "Review this research with Avara and choose your next high-signal experiment."
    ).toString(),
    etaDays: toInt(summaryIn.etaDays, 30),
    gtm: gtmIn
      ? {
          strategy: (gtmIn.strategy || "").toString(),
          summary: (gtmIn.summary || "").toString(),
          channels: Array.isArray(gtmIn.channels)
            ? gtmIn.channels.map((c) => c.toString())
            : [],
          confidence: isFiniteNum(gtmIn.confidence)
            ? Number(gtmIn.confidence)
            : undefined,
        }
      : undefined,
  };

  const sections = Array.isArray(input?.sections)
    ? input.sections.map((s, idx) => ({
        id: (s?.id || `section_${idx}`).toString(),
        title: (s?.title || "Untitled").toString(),
        kind: (s?.kind || "generic").toString(),
        html: (s?.html || "<p>Empty</p>").toString(),
      }))
    : [];

  const experiments = Array.isArray(input?.experiments)
    ? input.experiments.map((e, idx) => ({
        id: (e?.id || `exp_${idx}`).toString(),
        title: (e?.title || "Experiment").toString(),
        hypothesis: (e?.hypothesis || "").toString(),
        metric: (e?.metric || "").toString(),
        status: (e?.status || "planned").toString(),
      }))
    : [];

  const timeline = Array.isArray(input?.timeline)
    ? input.timeline.map((t, idx) => ({
        label: (t?.label || `Milestone ${idx + 1}`).toString(),
        etaDays: isFiniteNum(t?.etaDays) ? Number(t.etaDays) : undefined,
      }))
    : [];

  const personas = Array.isArray(input?.personas)
    ? input.personas.map((p, idx) => ({
        id: (p?.id || `persona_${idx}`).toString(),
        type: (p?.type || "primary").toString(),
        title: (p?.title || "").toString(),
        description: (p?.description || "").toString(),
        confidence: isFiniteNum(p?.confidence)
          ? Number(p.confidence)
          : undefined,
      }))
    : [];

  const competitors = Array.isArray(input?.competitors)
    ? input.competitors.map((c) => ({
        name: (c?.name || "").toString(),
        positioning: (c?.positioning || "").toString(),
        strengths: (c?.strengths || "").toString(),
        weaknesses: (c?.weaknesses || "").toString(),
        overlap: (c?.overlap || "").toString(),
      }))
    : [];

  const metaIn = input?.meta || {};
  const meta = {
    spa: metaIn.spa || undefined,
    clarifyingQuestions: Array.isArray(metaIn.clarifyingQuestions)
      ? metaIn.clarifyingQuestions.map((q) => q.toString())
      : [],
  };

  // 🔹 Analysis (PEST + SWOT) passthrough
  const analysisIn = input?.analysis || {};
  const pestIn = analysisIn.pest || {};
  const swotIn = analysisIn.swot || {};

  const analysis = {
    pest: analysisIn.pest
      ? {
          political: (pestIn.political || "").toString(),
          economic: (pestIn.economic || "").toString(),
          social: (pestIn.social || "").toString(),
          technological: (pestIn.technological || "").toString(),
          environmental: (pestIn.environmental || "").toString(),
          legal: (pestIn.legal || "").toString(),
        }
      : undefined,
    swot: analysisIn.swot
      ? {
          strengths: arrOfStrings(swotIn.strengths),
          weaknesses: arrOfStrings(swotIn.weaknesses),
          opportunities: arrOfStrings(swotIn.opportunities),
          threats: arrOfStrings(swotIn.threats),
        }
      : undefined,
  };

  return {
    projectId,
    summary,
    sections,
    experiments,
    personas,
    competitors,
    timeline,
    meta,
    analysis,
  };
}

function strOneOf(val, allowed, fallback) {
  return allowed.includes(val) ? val : fallback;
}

function isFiniteNum(v) {
  const n = Number(v);
  return Number.isFinite(n);
}

function toInt(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

function arrOfStrings(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => x?.toString?.() ?? "").filter(Boolean);
}
