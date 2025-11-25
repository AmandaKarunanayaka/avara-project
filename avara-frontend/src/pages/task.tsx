import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvaraLoader from "@/components/AvaraLoader";
import {
  Sparkles,
  ListChecks,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import "../css/research.css";

type Task = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  dueInDays?: number;
};

const getToken = () => localStorage.getItem("token") || "";

const TaskPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3007/task/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load tasks: ${res.status}`);
      }

      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "Failed to load tasks");
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
      const res = await fetch("http://localhost:3007/task/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate tasks: ${res.status}`);
      }

      await fetchTasks();
    } catch (err: any) {
      console.error("Error generating tasks:", err);
      setError(err.message || "Failed to generate tasks");
      alert("Failed to generate tasks from research.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div className="main flex h-full items-center justify-center">
        <AvaraLoader/>
      </div>
    );
  }

  const hasTasks = tasks.length > 0;

  const renderPriorityBadge = (priority?: string) => {
    if (!priority) return null;
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
        {priority.toUpperCase()}
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

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="main relative flex h-full flex-col gap-4">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/40">
            <ListChecks className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Tasks
            </h1>
            <p className="text-xs text-gray-400">
              Concrete next actions generated from your research.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasTasks && (
            <Badge
              variant="outline"
              className="border-zinc-700 text-[11px] text-zinc-300"
            >
              {tasks.length} tasks
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
            {hasTasks ? "Regenerate from Research" : "Generate from Research"}
          </Button>
        </div>
      </header>

      <Separator className="bg-white/10" />

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: Task groups */}
        <div className="space-y-4 overflow-y-auto pr-1 pb-10">
          {Object.keys(grouped).length === 0 && (
            <section className="rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
              <p className="text-[12px] text-gray-500 italic">
                No tasks generated yet. Use &quot;Generate from Research&quot; to
                create a prioritized task list.
              </p>
            </section>
          )}

          {Object.entries(grouped).map(([category, list]) => (
            <section
              key={category}
              className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    {category.toUpperCase()}
                  </p>
                  <h3 className="text-base font-semibold text-white">
                    {category === "validation"
                      ? "Validation tasks"
                      : category === "research"
                      ? "Research tasks"
                      : category === "product"
                      ? "Product tasks"
                      : category === "gtm"
                      ? "GTM tasks"
                      : "Other tasks"}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] border-zinc-700 text-zinc-300"
                >
                  {list.length} items
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {list.map((t) => (
                  <div
                    key={t.id || t.title}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] font-medium text-gray-100">
                        {t.title || "Untitled task"}
                      </h4>
                      <div className="flex flex-col items-end gap-1">
                        {renderPriorityBadge(t.priority)}
                        {renderStatusBadge(t.status)}
                      </div>
                    </div>
                    {t.description && (
                      <p className="text-[12px] text-gray-300 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {typeof t.dueInDays === "number"
                          ? `~${t.dueInDays} days`
                          : "No due hint"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT: explainer */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm space-y-2 text-[13px] text-gray-100 leading-relaxed">
            <h3 className="text-base font-semibold text-white">
              How tasks are generated
            </h3>
            <p className="text-[12px] text-gray-400">
              The task agent reads your research document (problem, solution,
              persona, SPA, experiments and GTM hints) and turns it into small,
              concrete tasks. It doesn&apos;t invent a new strategy; it breaks
              down what&apos;s already there.
            </p>
            <p className="text-[12px] text-gray-400">
              This is part of the same orchestration pattern: once research is
              done, the task service can be triggered with only the project id.
              It loads the shared research document from the database and writes
              a separate task document, so each agent stays independent while
              the overall behaviour feels agentic.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default TaskPage;
