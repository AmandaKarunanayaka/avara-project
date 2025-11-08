import { getOpenAI, MODELS } from "./openai.js";

/**
 * synthesizeDocument
 * - If gtms = false → DO NOT generate GTM/Market Model/Timeline (only show placeholders or omit).
 * - If gtms = true  → Generate Market Model, Market Model Validation, Go-to-Market strategies,
 *   Scaling & Distribution, and Practical Timeline (weeks).
 */
export async function synthesizeDocument({ intake, sources = [], gtms = false }) {
  if (process.env.USE_LLM === "false") {
    // Minimal mock
    const base = baseSkeleton(intake, gtms);
    return base;
  }

  const system = `
You are a founder-facing startup research analyst.
Return a STRICT JSON OBJECT. Do not include any free text outside JSON.
The JSON MUST have keys: summary, sections, experiments, timeline.
- summary MUST be an object with problem, solution, nextStep, effort, etaDays.
- problem and solution MUST have: state, confidence, why.
- sections MUST be an array of objects with: id, title, critical, html, citations.
- experiments MUST be an array with: title, metric, deadline (ISO date string).
- timeline MUST be an array with: week, title, deliverable, exitCriteria.

CRITICAL: Section IDs must be numbered: section_0, section_1, section_2, etc.

Rules:
- Provide Decision + Confidence for Problem and Solution.
- Sections ALWAYS include IN THIS EXACT ORDER:
  0) Executive Snapshot [id="section_0", critical=true]
  1) Problem Evidence [id="section_1", critical=true if problem not validated]
  2) Solution Evidence [id="section_2", critical=true if solution not validated]
  3) Market & Economics [id="section_3", critical=true] (macro/micro, TAM/SAM/SOM ranges with assumptions)
  4) Competitors [id="section_4", critical=true] (table as HTML)
  5) Customers & Channels [id="section_5", critical=true]
  6) Risks & Unknowns [id="section_6", critical=true]
  7) Experiments & Tasks [id="section_7", critical=true] (problem/solution validation)
  8) Citations [id="section_8", critical=true] (link list)

- If gtms=true, ALSO include:
  9) Market Model [id="section_9", critical=false] (how value is created/captured)
  10) Market Model Validation [id="section_10", critical=true] (assumptions + tests)
  11) Go-to-Market Strategy [id="section_11", critical=true] (ICP, channels, pricing bands, sequencing)
  12) Scaling & Distribution [id="section_12", critical=false] (partners, loops, sales motions)

- When gtms=false, only include sections 0-8.
- Timeline: if gtms=true, create a 8–12 week practical timeline. If gtms=false, return empty array.
- Keep section html concise (<800 words each), use <p>,<ul>,<li>,<strong>. Include citations array.
- If little data: label assumptions clearly.
- Experiments: 3–6 atomic tests with measurable success criteria and cheap methods (fit team size & capital).
- deadline should be ISO string, e.g., "2025-12-01T00:00:00.000Z"

IMPORTANT: Generate real, substantive content for each section based on the intake data. Do NOT return empty placeholders.`;

  const user = {
    intake,
    sources,
    gtms,
    hint: "Generate detailed research content based on the intake data provided."
  };

  try {
    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model: MODELS.SYNTH,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user, null, 2) }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(resp.choices[0].message.content);
    
    // Validate and fix structure if needed
    return validateAndFixStructure(result, intake, gtms);
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to skeleton on error
    return baseSkeleton(intake, gtms);
  }
}

/**
 * Validate and fix the structure returned by OpenAI
 */
function validateAndFixStructure(result, intake, gtms) {
  if (!result.summary || typeof result.summary !== 'object') {
    result.summary = {
      problem: { state: "refine", confidence: 0.5, why: "Analysis needed" },
      solution: { state: "refine", confidence: 0.5, why: "Analysis needed" },
      nextStep: gtms ? "Begin GTM execution" : "Approve validation experiments",
      effort: "S",
      etaDays: gtms ? 60 : 7
    };
  }

  if (!Array.isArray(result.sections)) {
    result.sections = [];
  }

  result.sections = result.sections.map((section, index) => ({
    ...section,
    id: `section_${index}`,
    citations: section.citations || []
  }));

  if (!Array.isArray(result.experiments)) {
    result.experiments = [];
  }

  result.experiments = result.experiments.map(exp => ({
    ...exp,
    deadline: exp.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }));

  if (!Array.isArray(result.timeline)) {
    result.timeline = [];
  }

  return result;
}

function baseSkeleton(intake, gtms) {
  const problemState = intake.problemValidated ? "validated" : "refine";
  const solutionState = intake.solutionExists 
    ? (intake.solutionValidated ? "validated" : "refine") 
    : "no_solution";
  
  const sections = [
    { 
      id: "section_0", 
      title: "Executive Snapshot", 
      critical: true, 
      html: `<p><strong>Project:</strong> ${intake.name}</p>
             <p><strong>Industry:</strong> ${intake.industry}</p>
             <p><strong>Problem:</strong> ${intake.problem}</p>
             ${intake.solution ? `<p><strong>Solution:</strong> ${intake.solution}</p>` : ''}
             <p><strong>Team:</strong> ${intake.teamCount} member${intake.teamCount !== 1 ? 's' : ''}</p>
             <p><strong>Capital:</strong> $${intake.capital.toLocaleString()}</p>`, 
      citations: [] 
    },
    { 
      id: "section_1", 
      title: "Problem Evidence", 
      critical: !intake.problemValidated, 
      html: `<p><strong>Problem Statement:</strong> ${intake.problem}</p>
             <p><strong>Validation Status:</strong> ${intake.problemValidated ? 'Validated' : 'Requires Validation'}</p>
             <p>Additional market research and customer interviews needed to validate problem-solution fit.</p>`, 
      citations: [] 
    },
    { 
      id: "section_2", 
      title: "Solution Evidence", 
      critical: intake.solutionExists && !intake.solutionValidated, 
      html: intake.solution 
        ? `<p><strong>Proposed Solution:</strong> ${intake.solution}</p>
           <p><strong>Validation Status:</strong> ${intake.solutionValidated ? 'Validated' : 'Requires Validation'}</p>
           <p>Testing and validation experiments required to confirm solution viability.</p>`
        : '<p>No solution defined yet. Focus on problem validation first.</p>', 
      citations: [] 
    },
    { 
      id: "section_3", 
      title: "Market & Economics", 
      critical: true, 
      html: `<p><strong>Industry:</strong> ${intake.industry}</p>
             <p><strong>Market Analysis:</strong> Comprehensive market sizing and economic analysis required.</p>
             <ul>
               <li>TAM (Total Addressable Market): TBD</li>
               <li>SAM (Serviceable Addressable Market): TBD</li>
               <li>SOM (Serviceable Obtainable Market): TBD</li>
             </ul>
             <p>Further research needed to quantify market opportunity.</p>`, 
      citations: [] 
    },
    { 
      id: "section_4", 
      title: "Competitors", 
      critical: true, 
      html: `<p>Competitive analysis pending. Research required to identify:</p>
             <ul>
               <li>Direct competitors</li>
               <li>Indirect competitors</li>
               <li>Alternative solutions</li>
               <li>Competitive advantages</li>
             </ul>`, 
      citations: [] 
    },
    { 
      id: "section_5", 
      title: "Customers & Channels", 
      critical: true, 
      html: `<p><strong>Target Customer Research:</strong></p>
             <ul>
               <li>Customer segments to identify</li>
               <li>Distribution channels to explore</li>
               <li>Customer acquisition strategies to develop</li>
             </ul>`, 
      citations: [] 
    },
    { 
      id: "section_6", 
      title: "Risks & Unknowns", 
      critical: true, 
      html: `<p><strong>Key Risks:</strong></p>
             <ul>
               <li>Market risk: Problem validation needed</li>
               <li>Solution risk: ${intake.solution ? 'Solution validation needed' : 'Solution not yet defined'}</li>
               <li>Execution risk: Team size ${intake.teamCount}, capital $${intake.capital.toLocaleString()}</li>
             </ul>`, 
      citations: [] 
    },
    { 
      id: "section_7", 
      title: "Experiments & Tasks", 
      critical: true, 
      html: `<p><strong>Recommended Validation Experiments:</strong></p>
             <ul>
               <li>Customer discovery interviews (target: 20-30 interviews)</li>
               <li>Problem validation survey</li>
               ${intake.solution ? '<li>Solution prototype testing</li>' : ''}
               <li>Market size validation</li>
             </ul>`, 
      citations: [] 
    },
    { 
      id: "section_8", 
      title: "Citations", 
      critical: false, 
      html: "<p>No external sources yet. Research phase pending.</p>", 
      citations: [] 
    }
  ];

  if (gtms) {
    sections.push(
      { 
        id: "section_9", 
        title: "Market Model", 
        critical: false, 
        html: "<p>Value creation and capture model to be defined based on validated problem-solution fit.</p>", 
        citations: [] 
      },
      { 
        id: "section_10", 
        title: "Market Model Validation", 
        critical: true, 
        html: "<p>Key assumptions and validation tests to be developed.</p>", 
        citations: [] 
      },
      { 
        id: "section_11", 
        title: "Go-to-Market Strategy", 
        critical: true, 
        html: "<p>GTM strategy including ICP, channels, pricing, and sequencing to be developed.</p>", 
        citations: [] 
      },
      { 
        id: "section_12", 
        title: "Scaling & Distribution", 
        critical: false, 
        html: "<p>Growth loops, partnerships, and sales motions to be defined.</p>", 
        citations: [] 
      }
    );
  }

  const experiments = [
    { 
      title: "Customer Discovery Interviews", 
      metric: "Complete 20 interviews with target customers", 
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      title: "Problem Validation Survey", 
      metric: "Collect 100+ responses confirming problem exists", 
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() 
    }
  ];

  if (intake.solution) {
    experiments.push({
      title: "Solution Prototype Test",
      metric: "Get 10+ users to test MVP prototype",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return {
    summary: {
      problem: { state: problemState, confidence: 0.5, why: "Pending validation research" },
      solution: { state: solutionState, confidence: 0.5, why: intake.solution ? "Pending validation testing" : "No solution defined yet" },
      nextStep: gtms ? "Begin GTM execution" : "Approve validation experiments",
      effort: "S",
      etaDays: gtms ? 60 : 7
    },
    sections,
    experiments,
    timeline: gtms ? [
      { week: 1, title: "GTM Kickoff", deliverable: "GTM Plan Draft", exitCriteria: "Team alignment on strategy" },
      { week: 4, title: "Channel Setup", deliverable: "Active distribution channels", exitCriteria: "First 10 leads generated" },
      { week: 8, title: "Initial Traction", deliverable: "First customers", exitCriteria: "5+ paying customers" },
      { week: 12, title: "Scale Prep", deliverable: "Scaling playbook", exitCriteria: "Repeatable customer acquisition" }
    ] : []
  };
}