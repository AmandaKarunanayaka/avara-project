import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvaraLoader from "@/components/AvaraLoader";
import {
  Sparkles,
  Calendar,
  Flag,
  Target,
  ListChecks,
  Clock,
} from "lucide-react";
import "../css/research.css";

type Milestone = {
  id?: string;
  title?: string;
  description?: string;
  metric?: string;
  dueOffsetWeeks?: number;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
};

type Phase = {
  id?: string;
  name?: string;
  order?: number;
  durationWeeks?: number;
  objective?: string;
  keyResult?: string;
  milestones?: Milestone[];
};

type RoadmapDoc = {
  horizonMonths?: number;
  overarchingGoal?: string;
  summary?: string;
  phases?: Phase[];
  updatedAt?: string;
};

const getToken = () => localStorage.getItem("token") || "";

const Roadmap: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [doc, setDoc] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3006/roadmap/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load roadmap: ${res.status}`);
      }

      const data = await res.json();
      setDoc(data.roadmap || null);
    } catch (err: any) {
      console.error("Error fetching roadmap:", err);
      setError(err.message || "Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch("http://localhost:3006/roadmap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate roadmap: ${res.status}`);
      }

      await fetchRoadmap();
    } catch (err: any) {
      console.error("Error generating roadmap:", err);
      setError(err.message || "Failed to generate roadmap");
      alert("Failed to generate roadmap from research.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div className="main flex h-full items-center justify-center">
        <AvaraLoader/>
      </div>
    );
  }

  const phases = doc?.phases || [];
  const hasRoadmap = phases.length > 0;

  const renderPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const label = priority.toUpperCase();
    return (
      <Badge
        className={cn(
          "text-[10px] rounded-full px-2 py-0.5 border",
          priority === "high" &&
            "border-red-500/60 text-red-200 bg-red-500/10",
          priority === "medium" &&
            "border-amber-500/60 text-amber-200 bg-amber-500/10",
          priority === "low" &&
            "border-emerald-500/60 text-emerald-200 bg-emerald-500/10"
        )}
      >
        {label}
      </Badge>
    );
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] rounded-full px-2 py-0.5 border-zinc-700 text-zinc-300",
          status === "done" && "border-emerald-500/60 text-emerald-200",
          status === "in_progress" && "border-sky-500/60 text-sky-200",
          status === "todo" && "border-zinc-600 text-zinc-300"
        )}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="main relative flex h-full flex-col gap-4">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/40">
            <ListChecks className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Roadmap
            </h1>
            <p className="text-xs text-gray-400">
              Phased execution plan generated from your research.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {doc?.horizonMonths && (
            <Badge
              variant="outline"
              className="border-zinc-700 text-[11px] text-zinc-300"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {doc.horizonMonths}-month horizon
            </Badge>
          )}

          <Button
            size="sm"
            disabled={generating || !projectId}
            onClick={handleGenerate}
            className={cn(
              "gap-2 rounded-xl px-4 text-xs",
              generating && "opacity-70 cursor-wait"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {hasRoadmap ? "Regenerate from Research" : "Generate from Research"}
          </Button>
        </div>
      </header>

      <Separator className="bg-white/10" />

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: Phases */}
        <div className="space-y-4 overflow-y-auto pr-1 pb-10">
          {doc?.overarchingGoal && (
            <section className="space-y-2 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-semibold text-white">
                  Overarching goal
                </h3>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed">
                {doc.overarchingGoal}
              </p>
            </section>
          )}

          {doc?.summary && (
            <section className="space-y-2 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-semibold text-white">
                  Roadmap summary
                </h3>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
                {doc.summary}
              </p>
            </section>
          )}

          {phases.length === 0 && (
            <section className="rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
              <p className="text-[12px] text-gray-500 italic">
                No roadmap generated yet. Use &quot;Generate from Research&quot;
                to create a phase-based plan from your validated research.
              </p>
            </section>
          )}

          {phases
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((phase) => {
              const ms = phase.milestones || [];
              return (
                <section
                  key={phase.id || phase.name}
                  className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">
                        Phase {phase.order ?? "?"}
                      </p>
                      <h3 className="text-base font-semibold text-white">
                        {phase.name || "Untitled phase"}
                      </h3>
                      {phase.objective && (
                        <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                          {phase.objective}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {phase.durationWeeks && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {phase.durationWeeks} weeks
                        </span>
                      )}
                      {ms.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[11px] border-zinc-700 text-zinc-300"
                        >
                          {ms.length} milestones
                        </Badge>
                      )}
                    </div>
                  </div>

                  {phase.keyResult && (
                    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-2">
                        <Target className="w-3 h-3 text-emerald-400" />
                        Key result
                      </p>
                      <p className="text-[13px] text-gray-100 leading-relaxed">
                        {phase.keyResult}
                      </p>
                    </div>
                  )}

                  {ms.length > 0 && (
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      {ms.map((m) => (
                        <div
                          key={m.id || m.title}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[13px] font-medium text-gray-100">
                              {m.title || "Untitled milestone"}
                            </h4>
                            <div className="flex flex-col items-end gap-1">
                              {renderPriorityBadge(m.priority)}
                              {renderStatusBadge(m.status)}
                            </div>
                          </div>
                          {m.description && (
                            <p className="text-[12px] text-gray-300 leading-relaxed">
                              {m.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                            {m.metric && (
                              <span className="truncate">
                                Metric: {m.metric}
                              </span>
                            )}
                            {typeof m.dueOffsetWeeks === "number" && (
                              <span>{m.dueOffsetWeeks}w from phase start</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>

        {/* RIGHT: explainer */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm space-y-2 text-[13px] text-gray-100 leading-relaxed">
            <h3 className="text-base font-semibold text-white">
              How this roadmap is created
            </h3>
            <p className="text-[12px] text-gray-400">
              The roadmap agent reads your research document (problem, solution,
              persona, SPA, competitors, PEST, SWOT and experiments) and
              converts it into a phased execution plan with milestones. It does
              not invent a new strategy; it operationalises what the research
              already suggests.
            </p>
            <p className="text-[12px] text-gray-400">
              This is part of the orchestration: once the research pipeline
              reaches GTM-ready state, the roadmap service can be triggered with
              just the project id. The service loads the shared research
              document from the database and writes its own roadmap document,
              keeping each agent independent but coordinated.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Roadmap;
