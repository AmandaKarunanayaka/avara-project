"use client";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CarouselCard from "@/components/ui/CarouselCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AvaraLoader from "@/components/AvaraLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "/src/css/carousel.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  title: string;
  description: string;
  layout?: "centered" | "left" | "right";
  compact?: boolean;
  content: React.ReactNode;
  onNext?: () => void;
  showBack?: boolean;
  nextLabel?: string;
  titleClassName?: string;
  descClassName?: string;
}

function useStartupInfo() {
  const location = useLocation() as any;
  return {
    startupName: location?.state?.startupName || "Untitled Startup",
    projectId: location?.state?.projectId || null,
  };
}

type PathType = "problem" | "resource";

type Answers = {
  pathType: PathType;
  industry: string;
  region: string;
  problem: string;
  problemValidated: boolean;
  solution: string; // solution for problem-first, "optional ideas" for resource-first
  solutionExists: boolean;
  solutionValidated: boolean;
  resourceDescription: string;
  resourceIntent: string;
  teamCount: number;
  teamSkills: string[];
};

type ErrorState = {
  industry?: string;
  region?: string;
  problem?: string;
  resourceDescription?: string;
  solution?: string;
  teamSkills?: string;
};

const getToken = () => localStorage.getItem("token") || "";

export default function Question() {
  const navigate = useNavigate();
  const { startupName, projectId } = useStartupInfo();

  const [step, setStep] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    pathType: "problem",
    industry: "",
    region: "",
    problem: "",
    problemValidated: false,
    solution: "",
    solutionExists: false,
    solutionValidated: false,
    resourceDescription: "",
    resourceIntent: "",
    teamCount: 1,
    teamSkills: [""],
  });
  const [errors, setErrors] = useState<ErrorState>({});

  // ---------- Load draft on mount ----------
  useEffect(() => {
    const token = getToken();
    if (!token || !projectId) {
      setInitializing(false);
      return;
    }

    let cancelled = false;
    const start = performance.now();

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:3004/research/${projectId}/draft`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (cancelled) return;

        if (res.status === 204) {
          return;
        }

        if (!res.ok) {
          console.error("Draft load failed:", res.status);
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.answers) {
          setAnswers((prev) => ({
            ...prev,
            ...data.answers,
            region: data.answers.region || prev.region || "",
            teamSkills:
              data.answers.teamSkills && data.answers.teamSkills.length
                ? data.answers.teamSkills
                : prev.teamSkills,
            teamCount:
              typeof data.answers.teamCount === "number"
                ? data.answers.teamCount
                : prev.teamCount,
            pathType: (data.answers.pathType as PathType) || prev.pathType,
          }));
        }

        if (typeof data.step === "number") {
          setStep(data.step);
        }
      } catch (err) {
        console.error("Error fetching draft:", err);
      } finally {
        if (!cancelled) {
          const elapsed = performance.now() - start;
          const remaining = Math.max(0, 1500 - elapsed);
          setTimeout(() => {
            if (!cancelled) setInitializing(false);
          }, remaining);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ---------- Save draft whenever changing step ----------
  const goToStep = (nextStep: number) => {
    setStep(nextStep);

    const token = getToken();
    if (!token || !projectId) return;

    const payload = {
      projectId,
      step: nextStep,
      answers,
    };

    fetch("http://localhost:3004/research/draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).catch((e) => console.error("Failed to save draft:", e));
  };

  const ensureSkillsSize = (count: number) => {
    setAnswers((prev) => {
      const skills = [...(prev.teamSkills || [])];
      if (count > skills.length) {
        while (skills.length < count) skills.push("");
      } else if (count < skills.length) {
        skills.length = Math.max(1, count);
      }
      return { ...prev, teamCount: count, teamSkills: skills };
    });
  };

  // ---------- Validation before submit ----------
  const validateBeforeSubmit = (): boolean => {
    const newErrors: ErrorState = {};
    const isProblemFirst = answers.pathType === "problem";

    if (!answers.region.trim()) {
      newErrors.region = "Tell us your primary region / market (you can say 'Global' if unsure).";
    }

    if (isProblemFirst) {
      if (!answers.industry.trim()) {
        newErrors.industry = "Please add your primary industry.";
      }
      if (!answers.problem.trim()) {
        newErrors.problem = "Tell Avara what problem you’re trying to solve.";
      }
      if (answers.solutionExists && !answers.solution.trim()) {
        newErrors.solution =
          "You marked that a solution exists. Please describe it, or switch to 'No'.";
      }
    } else {
      // resource-first
      if (!answers.resourceDescription.trim()) {
        newErrors.resourceDescription =
          "Describe the resource you control so Avara can explore options.";
      }
    }

    // team skills must have at least one non-empty value
    const hasSkill = answers.teamSkills.some((s) => s.trim().length > 0);
    if (!hasSkill) {
      newErrors.teamSkills =
        "Add at least one team member skill so we can scope experiments realistically.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Steps ----------
  const steps: Step[] = useMemo(
    () => [
      {
        key: "intro",
        title: "Let’s Build Something Great",
        description:
          "Answer a few quick questions. We’ll shape your problem, solution and personas, then build the research pack around that triad.",
        layout: "centered",
        compact: true,
        titleClassName: "carousel-intro-title",
        descClassName: "carousel-intro-desc",
        content: (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <span className="opacity-80">Project:</span>{" "}
              <span className="font-semibold text-white">{startupName}</span>
            </p>
          </div>
        ),
        onNext: () => goToStep(1),
        showBack: false,
      },

      {
        key: "mode",
        title: "How do you want to start?",
        description:
          "Are you building around a clear problem, or a unique resource you have access to?",
        titleClassName: "carousel-step-title",
        descClassName: "carousel-step-desc",
        content: (
          <div className="form-wrap space-y-4">
            <Label>Path</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  answers.pathType === "problem"
                    ? "border-[#F5C76B] bg-[#1B170E]"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                )}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    pathType: "problem",
                  }))
                }
              >
                <p className="font-semibold text-white text-sm">
                  Problem-first
                </p>
                <p className="text-white/70 mt-1 text-[11px] leading-relaxed">
                  You’ve seen a pain in the world and want to solve it.
                </p>
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  answers.pathType === "resource"
                    ? "border-[#F5C76B] bg-[#1B170E]"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                )}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    pathType: "resource",
                  }))
                }
              >
                <p className="font-semibold text-white text-sm">
                  Resource-first
                </p>
                <p className="text-white/70 mt-1 text-[11px] leading-relaxed">
                  You have a unique resource (material, network, data, tech)
                  and want to build around it.
                </p>
              </button>
            </div>
          </div>
        ),
        onNext: () => goToStep(2),
      },

      {
        key: "context",
        title:
          answers.pathType === "problem"
            ? "Which industry and region are you in?"
            : "What resource and region are you in?",
        description:
          answers.pathType === "problem"
            ? "Industry + region help us anchor your problem, SPA, PEST/SWOT and competitor scan."
            : "Describe the resource and where you operate. We’ll infer the best starting industry and run local SPA / competitor checks.",
        titleClassName: "carousel-step-title",
        descClassName: "carousel-step-desc",
        content: (
          <div className="form-wrap space-y-4">
            {answers.pathType === "problem" ? (
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., EdTech, FinTech, HealthTech"
                  value={answers.industry}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      industry: e.target.value,
                    }))
                  }
                  className={cn(
                    errors.industry &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.industry && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.industry}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="resourceDescription">Resource</Label>
                  <Textarea
                    id="resourceDescription"
                    placeholder="e.g., Access to lotus stems from Sri Lankan wetlands, a dataset of 10M receipts, a trusted network of 2,000 tuk drivers..."
                    value={answers.resourceDescription}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        resourceDescription: e.target.value,
                      }))
                    }
                    rows={4}
                    className={cn(
                      errors.resourceDescription &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {errors.resourceDescription && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.resourceDescription}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceIntent">
                    Rough space or intent (optional)
                  </Label>
                  <Input
                    id="resourceIntent"
                    placeholder="e.g., probably textiles / materials, maybe tourism, not sure yet..."
                    value={answers.resourceIntent}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        resourceIntent: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="region">Region / primary market</Label>
              <Input
                id="region"
                placeholder="e.g., Sri Lanka, UK, EU, GCC, or 'Global'"
                value={answers.region}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    region: e.target.value,
                  }))
                }
                className={cn(
                  errors.region && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.region && (
                <p className="mt-1 text-xs text-red-400">{errors.region}</p>
              )}
              <p className="text-[11px] text-white/60 mt-1">
                Used for SPA scoring, PEST context and small competitor scan.
                If unsure, write your first target region.
              </p>
            </div>
          </div>
        ),
        onNext: () => goToStep(3),
      },

      {
        key: "problem",
        title:
          answers.pathType === "problem"
            ? "What problem are you solving?"
            : "Is there a problem you already see?",
        description:
          answers.pathType === "problem"
            ? "Be specific. This becomes the core of the triad and feeds SPA and SWOT."
            : "If you can already see a clear pain this resource could solve, describe it. Otherwise, keep it light.",
        titleClassName: "carousel-step-title",
        descClassName: "carousel-step-desc",
        content: (
          <div className="form-wrap space-y-6">
            <div className="space-y-3">
              <Label htmlFor="problem">Problem Statement</Label>
              <Textarea
                id="problem"
                placeholder={
                  answers.pathType === "problem"
                    ? "Describe the pain, who experiences it, and why it matters."
                    : "Optional: Describe the pain or gap you think this resource could address."
                }
                value={answers.problem}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, problem: e.target.value }))
                }
                rows={5}
                className={cn(
                  errors.problem &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.problem && (
                <p className="mt-1 text-xs text-red-400">{errors.problem}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Has the problem been validated?</Label>
              <Select
                value={answers.problemValidated ? "yes" : "no"}
                onValueChange={(v) =>
                  setAnswers((prev) => ({
                    ...prev,
                    problemValidated: v === "yes",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
        onNext: () => goToStep(4),
      },

      {
        key: "solution",
        title:
          answers.pathType === "problem"
            ? "What solution are you proposing?"
            : "We’ll co-design solutions later",
        description:
          answers.pathType === "problem"
            ? "If there isn’t a solution yet, choose No—we can generate options and experiments with you."
            : "For resource-first builders, you don’t need a solution yet. Avara will explore strong directions based on your resource and market fit.",
        titleClassName: "carousel-step-title",
        descClassName: "carousel-step-desc",
        content:
          answers.pathType === "problem" ? (
            <div className="form-wrap space-y-6">
              <div className="space-y-3">
                <Label>Does a solution exist?</Label>
                <Select
                  value={answers.solutionExists ? "yes" : "no"}
                  onValueChange={(v) => {
                    const exists = v === "yes";
                    setAnswers((prev) => ({
                      ...prev,
                      solutionExists: exists,
                      solution: exists ? prev.solution : "",
                      solutionValidated: exists ? prev.solutionValidated : false,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className={cn(
                  "space-y-3 transition-opacity",
                  !answers.solutionExists &&
                    "opacity-50 pointer-events-none select-none"
                )}
              >
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  placeholder="Describe your approach or product idea. e.g., Multi-agent adaptive learning for personalized retention."
                  value={answers.solution}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      solution: e.target.value,
                    }))
                  }
                  rows={5}
                  disabled={!answers.solutionExists}
                  className={cn(
                    errors.solution &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.solution && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.solution}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "space-y-3 transition-opacity",
                  !answers.solutionExists &&
                    "opacity-50 pointer-events-none select-none"
                )}
              >
                <Label>Has the solution been validated?</Label>
                <Select
                  value={answers.solutionValidated ? "yes" : "no"}
                  onValueChange={(v) =>
                    setAnswers((prev) => ({
                      ...prev,
                      solutionValidated: v === "yes",
                    }))
                  }
                  disabled={!answers.solutionExists}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="form-wrap space-y-4">
              <p className="text-sm text-white/75 leading-relaxed">
                You’re starting from the resource. That’s enough for now. Avara
                will explore the landscape and suggest strong solution paths.
                <br />
                <br />
                If you already have any half-baked ideas, you can drop them
                here as notes. They won’t lock you in and will just guide early
                SPA and persona shaping.
              </p>
              <div className="space-y-2">
                <Label htmlFor="resourceIdeas">
                  Optional ideas (just notes for now)
                </Label>
                <Textarea
                  id="resourceIdeas"
                  placeholder="Any rough ideas for how this resource could be used? Totally optional."
                  value={answers.solution}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      solution: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </div>
          ),
        onNext: () => goToStep(5),
      },

      {
        key: "team",
        title: "Tell us about your team",
        description:
          "We’ll tailor experiments and tasks to your team’s capacity.",
        titleClassName: "carousel-step-title",
        descClassName: "carousel-step-desc",
        content: (
          <div className="form-wrap space-y-6">
            <div className="space-y-3">
              <Label htmlFor="teamCount">
                How many members are in your team?
              </Label>
              <Select
                value={String(answers.teamCount)}
                onValueChange={(v) => ensureSkillsSize(parseInt(v, 10))}
              >
                <SelectTrigger id="teamCount">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>What are their skills?</Label>
              <div className="skills-scroll max-h-[50vh] overflow-auto">
                <div className="skills-grid">
                  {answers.teamSkills.map((skill, idx) => (
                    <Input
                      key={idx}
                      placeholder={`Member ${idx + 1} skill`}
                      value={skill}
                      onChange={(e) =>
                        setAnswers((prev) => {
                          const teamSkills = [...prev.teamSkills];
                          teamSkills[idx] = e.target.value;
                          return { ...prev, teamSkills };
                        })
                      }
                      className={cn(
                        "input-dark",
                        errors.teamSkills &&
                          "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  ))}
                </div>
              </div>
              {errors.teamSkills && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.teamSkills}
                </p>
              )}
            </div>
          </div>
        ),
        onNext: () => handleSubmit(),
        nextLabel: "Create Research",
      },
    ],
    [answers, startupName, errors]
  );

  // ---------- Submit ----------
  const handleSubmit = async () => {
    const token = getToken();
    if (!token) return alert("Please login first.");
    if (!projectId) return alert("Missing projectId from navigation state.");

    // front-end guardrails
    const ok = validateBeforeSubmit();
    if (!ok) {
      // stay on same step, show inline errors
      return;
    }

    const isProblemFirst = answers.pathType === "problem";

    const payload = {
      projectId,
      pathType: answers.pathType,
      name: startupName,
      industry: answers.industry.trim(),
      region: answers.region.trim(),
      problem: answers.problem.trim(),
      problemValidated: answers.problemValidated,
      solution: answers.solution.trim(),
      solutionExists: isProblemFirst
        ? answers.solutionExists || answers.solution.trim().length > 0
        : false,
      solutionValidated: isProblemFirst ? answers.solutionValidated : false,
      resourceDescription: answers.resourceDescription.trim(),
      resourceIntent: answers.resourceIntent.trim(),
      progressBrief: "Created via onboarding carousel",
      teamCount: answers.teamCount,
      teamSkills: answers.teamSkills.map((s) => s.trim()).filter(Boolean),
      capital: 0,
    };

    try {
      setSubmitting(true);

      const res = await fetch("http://localhost:3004/research/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      navigate(`/research/${payload.projectId}`, { state: { doc: data.doc } });
    } catch (e) {
      console.error("Failed to start research:", e);
      alert(
        "Failed to create research. Please check your inputs or try again in a moment."
      );
      setSubmitting(false);
    }
  };

  const page = steps[step];

  if (initializing) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-[#262626dc] z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <AvaraLoader />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-full items-center justify-center"
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <CarouselCard
        title={page.title}
        description={page.description}
        layout={page.layout}
        onNext={page.onNext}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        showBack={step !== 0}
        nextLabel={
          page.nextLabel || (step === steps.length - 1 ? "Finish" : "Next")
        }
        compact={page.compact}
        titleClassName={page.titleClassName || "carousel-step-title"}
        descClassName={page.descClassName || "carousel-step-desc"}
      >
        {page.content}
      </CarouselCard>

      {(initializing || submitting) && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-[#262626] z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AvaraLoader />
        </motion.div>
      )}
    </motion.div>
  );
}
