// Case A branching + gates
export const decideValidation = (intake) => {
  const needProblem = !Boolean(intake.problemValidated);
  const needSolution = Boolean(intake.solutionExists) && !Boolean(intake.solutionValidated);

  const plan = [];
  if (needProblem) {
    plan.push({ stage: "problem_validation",
      evidence: ["market_size_signals","search_trends","customer_complaints","competitor_positioning"] });
  }
  if (needSolution) {
    plan.push({ stage: "solution_validation",
      evidence: ["benchmarks","switching_costs","distribution_access","pricing_bands"] });
  }
  plan.push({ stage: "research_pack", evidence: ["macro","micro","competitors","channels","pricing"] });

  return { needProblem, needSolution, plan };
};
