export function normalizeResearchDoc(input, { projectId }) {
  const safe = (v, d) => (v === null || v === undefined ? d : v);

  // Summary
  let summary = input?.summary;
  if (typeof summary === "string") {
    // LLM sometimes returns a paragraph; wrap it safely
    summary = {
      problem: { state: "refine", confidence: 0.5, why: summary.slice(0, 240) },
      solution: { state: "refine", confidence: 0.5, why: "Generated text (coerced from string summary)" },
      nextStep: "Review summary and rerun research",
      effort: "S",
      etaDays: 7
    };
  } else {
    summary = {
      problem: {
        state: oneOf(safe(summary?.problem?.state, "refine"), ["validated","refine","not_validated"]),
        confidence: num0to1(summary?.problem?.confidence, 0.5),
        why: safe(summary?.problem?.why, "—")
      },
      solution: {
        state: oneOf(safe(summary?.solution?.state, "refine"), ["validated","refine","no_solution"]),
        confidence: num0to1(summary?.solution?.confidence, 0.5),
        why: safe(summary?.solution?.why, "—")
      },
      nextStep: safe(summary?.nextStep, "Approve validation experiments"),
      effort: oneOf(safe(summary?.effort, "S"), ["S","M","L"]),
      etaDays: isFiniteNum(summary?.etaDays) ? summary.etaDays : 7
    };
  }

  // Sections
  const sections = Array.isArray(input?.sections) ? input.sections : [];
  const normalizedSections = sections.map((s, idx) => ({
    id: String(s?.id ?? `section_${idx}`),
    title: String(s?.title ?? "Untitled"),
    critical: Boolean(s?.critical ?? false),
    html: String(s?.html ?? "<p>Empty</p>"),
    citations: Array.isArray(s?.citations) ? s.citations.map(c => ({
      url: String(c?.url ?? ""),
      title: String(c?.title ?? ""),
      date: String(c?.date ?? ""),
      note: String(c?.note ?? "")
    })) : []
  }));

  // Experiments
  const experiments = Array.isArray(input?.experiments) ? input.experiments.map((e) => ({
    title: String(e?.title ?? "Experiment"),
    metric: String(e?.metric ?? "Define success metric"),
    deadline: e?.deadline ? new Date(e.deadline) : undefined
  })) : [];

  // Timeline (optional)
  const timeline = Array.isArray(input?.timeline) ? input.timeline.map((t) => ({
    week: toInt(t?.week, 1),
    title: String(t?.title ?? "Milestone"),
    deliverable: String(t?.deliverable ?? "—"),
    exitCriteria: String(t?.exitCriteria ?? "—")
  })) : [];

  return {
    projectId,
    summary,
    sections: normalizedSections,
    experiments,
    timeline
  };
}

/* ---------- helpers ---------- */
function oneOf(val, list) { return list.includes(val) ? val : list[0]; }
function num0to1(v, d=0.5){ const n = Number(v); return isFinite(n) ? Math.max(0, Math.min(1, n)) : d; }
function isFiniteNum(v){ return Number.isFinite(Number(v)); }
function toInt(v, d=0){ const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
