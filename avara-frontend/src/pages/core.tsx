import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvaraLoader from "@/components/AvaraLoader";
import { Sparkles, Target, Flag, Compass, Quote } from "lucide-react";
import "../css/research.css";

type CoreDoc = {
  purpose?: string;
  mission?: string;
  vision?: string;
  strategicFocus?: string;
  brandValues?: string[];
  tagline?: string;
  updatedAt?: string;
};

const getToken = () => localStorage.getItem("token") || "";

const Core: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [doc, setDoc] = useState<CoreDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCore = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3002/core/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load core: ${res.status}`);
      }

      const data = await res.json();
      setDoc(data.core || null);
    } catch (err: any) {
      console.error("Error fetching core:", err);
      setError(err.message || "Failed to load core setup");
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
      const res = await fetch("http://localhost:3002/core/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate core: ${res.status}`);
      }

      await fetchCore();
    } catch (err: any) {
      console.error("Error generating core setup:", err);
      setError(err.message || "Failed to generate core setup");
      alert("Failed to generate core setup from research.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchCore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div className="main flex h-full items-center justify-center">
        <AvaraLoader/>
      </div>
    );
  }

  const hasCore =
    !!doc?.purpose || !!doc?.mission || !!doc?.vision || !!doc?.strategicFocus;

  const brandValues = doc?.brandValues || [];
  const tagline = doc?.tagline || "";

  return (
    <div className="main relative flex h-full flex-col gap-4">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/40">
            <Sparkles className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Business Core Setup
            </h1>
            <p className="text-xs text-gray-400">
              Purpose, mission, vision and strategic focus derived from your
              research.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {doc?.updatedAt && (
            <Badge
              variant="outline"
              className="border-zinc-700 text-[11px] text-zinc-300"
            >
              Last updated:{" "}
              {new Date(doc.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
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
            {hasCore ? "Regenerate from Research" : "Generate from Research"}
          </Button>
        </div>
      </header>

      <Separator className="bg-white/10" />

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: Core narrative */}
        <div className="space-y-4 overflow-y-auto pr-1 pb-10">
          {/* Tagline & brand values */}
          <section className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  Core narrative
                </h3>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  This is the high-level identity of the venture – how it talks
                  about itself, what it believes, and what it is trying to
                  become.
                </p>
              </div>
            </div>

            {tagline ? (
              <div className="mt-2 space-y-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-2">
                  <Quote className="w-3 h-3 text-sky-400" />
                  Internal tagline
                </p>
                <p className="text-sm text-gray-100 leading-relaxed">
                  {tagline}
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-gray-500 italic">
                No tagline yet. Generate from research to populate this.
              </p>
            )}

            {brandValues.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Brand values
                </p>
                <div className="flex flex-wrap gap-2">
                  {brandValues.map((v, idx) => (
                    <Badge
                      key={`${v}-${idx}`}
                      className="bg-zinc-900 border-zinc-700 text-[11px] text-zinc-200 rounded-full px-3 py-1"
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Purpose */}
          <section className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Purpose (why this exists)
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  The deeper reason for the venture beyond profit or a single
                  product.
                </p>
              </div>
            </div>

            {doc?.purpose ? (
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
                {doc.purpose}
              </p>
            ) : (
              <p className="text-[12px] text-gray-500 italic">
                Purpose not generated yet.
              </p>
            )}
          </section>

          {/* Mission */}
          <section className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-400" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Mission (what we do & for whom)
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  A short, practical description of what the venture does, and
                  for which primary audience.
                </p>
              </div>
            </div>

            {doc?.mission ? (
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
                {doc.mission}
              </p>
            ) : (
              <p className="text-[12px] text-gray-500 italic">
                Mission not generated yet.
              </p>
            )}
          </section>

          {/* Vision */}
          <section className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Vision (if we win)
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  A description of the future state of the world if this venture
                  succeeds.
                </p>
              </div>
            </div>

            {doc?.vision ? (
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
                {doc.vision}
              </p>
            ) : (
              <p className="text-[12px] text-gray-500 italic">
                Vision not generated yet.
              </p>
            )}
          </section>

          {/* Strategic Focus */}
          <section className="space-y-3 rounded-2xl border border-gray-800 bg-zinc-950/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Strategic focus
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  Who we serve first, what value we promise, and how we are
                  different in practice.
                </p>
              </div>
            </div>

            {doc?.strategicFocus ? (
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
                {doc.strategicFocus}
              </p>
            ) : (
              <p className="text-[12px] text-gray-500 italic">
                Strategic focus not generated yet.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT: Context panel */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm space-y-2 text-[13px] text-gray-100 leading-relaxed">
            <h3 className="text-base font-semibold text-white">
              How this is generated
            </h3>
            <p className="text-[12px] text-gray-400">
              The business core is generated from your validated research:
              problem, solution, persona, SPA scores, competitors and early GTM
              direction. The agent translates those into a coherent purpose,
              mission, vision and strategic focus.
            </p>
            <p className="text-[12px] text-gray-400">
              This makes the platform agentic: the research pipeline reaches a
              GTM-ready state, and then the core agent synthesises this page
              automatically using only the project&apos;s id and shared
              research document.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Core;
