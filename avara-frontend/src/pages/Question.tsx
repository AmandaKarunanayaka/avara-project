"use client";

import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CarouselCard from "@/components/ui/CarouselCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "/src/css/carousel.css";

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
    projectId: location?.state?.projectId || null
  };
}

type Answers = {
  industry: string;
  problem: string;
  problemValidated: boolean;
  solution: string;
  solutionExists: boolean;
  solutionValidated: boolean;
  teamCount: number;
  teamSkills: string[];
};

export default function Question() {
  const navigate = useNavigate();
  const { startupName, projectId } = useStartupInfo();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    industry: "",
    problem: "",
    problemValidated: false,
    solution: "",
    solutionExists: false,
    solutionValidated: false,
    teamCount: 1,
    teamSkills: [""],
  });

  const ensureSkillsSize = (count: number) => {
    setAnswers(prev => {
      const skills = [...(prev.teamSkills || [])];
      if (count > skills.length) {
        while (skills.length < count) skills.push("");
      } else if (count < skills.length) {
        skills.length = Math.max(1, count);
      }
      return { ...prev, teamCount: count, teamSkills: skills };
    });
  };

  const steps: Step[] = useMemo(() => [
    {
      key: "intro",
      title: "Let’s Build Something Great",
      description: "Answer a few quick questions. We’ll create a research pack and roadmap for your startup.",
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
      onNext: () => setStep(1),
      showBack: false,
    },

    {
      key: "industry",
      title: "Which industry is your startup in?",
      description: "This helps us find the right benchmarks and competitors.",
      titleClassName: "carousel-step-title",
      descClassName: "carousel-step-desc",
      content: (
        <div className="form-wrap space-y-3">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            placeholder="e.g., EdTech, FinTech, HealthTech"
            value={answers.industry}
            onChange={(e) => setAnswers(prev => ({ ...prev, industry: e.target.value }))}
          />
        </div>
      ),
      onNext: () => setStep(2),
    },

    {
      key: "problem",
      title: "What problem are you solving?",
      description: "Be specific. We’ll use this for problem validation.",
      titleClassName: "carousel-step-title",
      descClassName: "carousel-step-desc",
      content: (
        <div className="form-wrap space-y-6">
          <div className="space-y-3">
            <Label htmlFor="problem">Problem Statement</Label>
            <Textarea
              id="problem"
              placeholder="Describe the pain, who experiences it, and why it matters."
              value={answers.problem}
              onChange={(e) => setAnswers(prev => ({ ...prev, problem: e.target.value }))}
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label>Has the problem been validated?</Label>
            <Select
              value={answers.problemValidated ? "yes" : "no"}
              onValueChange={(v) => setAnswers(prev => ({ ...prev, problemValidated: v === "yes" }))}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      onNext: () => setStep(3),
    },

    {
      key: "solution",
      title: "What solution are you proposing?",
      description: "If there isn’t a solution yet, choose No—we can generate options for you.",
      titleClassName: "carousel-step-title",
      descClassName: "carousel-step-desc",
      content: (
        <div className="form-wrap space-y-6">
          <div className="space-y-3">
            <Label>Does a solution exist?</Label>
            <Select
              value={answers.solutionExists ? "yes" : "no"}
              onValueChange={(v) => {
                const exists = v === "yes";
                setAnswers(prev => ({
                  ...prev,
                  solutionExists: exists,
                  solution: exists ? prev.solution : "",
                  solutionValidated: exists ? prev.solutionValidated : false,
                }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`space-y-3 ${!answers.solutionExists ? "opacity-50 pointer-events-none" : ""}`}>
            <Label htmlFor="solution">Solution</Label>
            <Textarea
              id="solution"
              placeholder="Describe your approach or product idea. e.g., Multi-agent adaptive learning for personalized retention."
              value={answers.solution}
              onChange={(e) => setAnswers(prev => ({ ...prev, solution: e.target.value }))}
              rows={5}
              disabled={!answers.solutionExists}
            />
          </div>

          <div className={`space-y-3 ${!answers.solutionExists ? "opacity-50 pointer-events-none" : ""}`}>
            <Label>Has the solution been validated?</Label>
            <Select
              value={answers.solutionValidated ? "yes" : "no"}
              onValueChange={(v) => setAnswers(prev => ({ ...prev, solutionValidated: v === "yes" }))}
              disabled={!answers.solutionExists}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      onNext: () => setStep(4),
    },

    {
      key: "team",
      title: "Tell us about your team",
      description: "We’ll tailor experiments and tasks to your team’s capacity.",
      titleClassName: "carousel-step-title",
      descClassName: "carousel-step-desc",
      content: (
        <div className="form-wrap space-y-6">
          <div className="space-y-3">
            <Label htmlFor="teamCount">How many members are in your team?</Label>
            <Select
              value={String(answers.teamCount)}
              onValueChange={(v) => ensureSkillsSize(parseInt(v, 10))}
            >
              <SelectTrigger id="teamCount"><SelectValue placeholder="Select count" /></SelectTrigger>
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
                      setAnswers(prev => {
                        const teamSkills = [...prev.teamSkills];
                        teamSkills[idx] = e.target.value;
                        return { ...prev, teamSkills };
                      })
                    }
                    className="input-dark"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      onNext: () => handleSubmit(),
      nextLabel: "Create Research",
    },
  ], [answers, startupName]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token") || "";
    if (!token) return alert("Please login first.");
    if (!projectId) return alert("Missing projectId from navigation state.");

    const payload = {
      projectId,                          
      name: startupName,
      industry: answers.industry.trim(),
      problem: answers.problem.trim(),
      problemValidated: answers.problemValidated,
      solution: answers.solution.trim(),
      solutionExists: answers.solutionExists || answers.solution.trim().length > 0,
      solutionValidated: answers.solutionValidated,
      progressBrief: "Created via onboarding carousel",
      teamCount: answers.teamCount,
      teamSkills: answers.teamSkills.map(s => s.trim()).filter(Boolean),
      capital: 0,
    };

    try {
      const res = await fetch("http://localhost:3004/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      navigate(`/research/${payload.projectId}`, { state: { doc: data.doc } });
    } catch (e) {
      console.error("Failed to start research:", e);
      alert("Failed to create research. Please try again.");
    }
  };

  const page = steps[step];

  return (
    <CarouselCard
      title={page.title}
      description={page.description}
      layout={page.layout}
      onNext={page.onNext}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      showBack={step !== 0}
      nextLabel={page.nextLabel || (step === steps.length - 1 ? "Finish" : "Next")}
      compact={page.compact}
      titleClassName={page.titleClassName || "carousel-step-title"}
      descClassName={page.descClassName || "carousel-step-desc"}
    >
      {page.content}
    </CarouselCard>
  );
}
