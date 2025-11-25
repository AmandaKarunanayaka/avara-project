import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvaraLoader from "@/components/AvaraLoader";
import { AlertTriangle, Shield, Sparkles } from "lucide-react";
import "../css/research.css";

type RiskItem = {
    id?: string;
    scope?: "problem" | "core" | "gtm";
    title?: string;
    description?: string;
    category?: string;
    impact?: number;      
    likelihood?: number;  
    severity?: "low" | "medium" | "high";
    mitigation?: string;
    sourceHint?: string;
};

type RiskDoc = {
    summary?: string;
    problemRisks?: RiskItem[];
    coreRisks?: RiskItem[];
    gtmRisks?: RiskItem[];
};

const getToken = () => localStorage.getItem("token") || "";

export default function Risk() {
    const { projectId } = useParams<{ projectId: string }>();

    const [doc, setDoc] = useState<RiskDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRisk = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3005/risk/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load risk analysis");
            const data = await res.json();
            setDoc(data);
        } catch (err: any) {
            setError(err.message || "Failed to load risk analysis");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchRisk();
    }, [projectId]);

    if (loading) return <AvaraLoader />;
    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-300 text-sm">
                    {error || "Risk analysis not found."}
                </p>
            </div>
        );
    }

    const summary = doc?.summary || "";
    const problemRisks = doc?.problemRisks || [];
    const coreRisks = doc?.coreRisks || [];
    const gtmRisks = doc?.gtmRisks || [];

    const totalRisks =
        problemRisks.length + coreRisks.length + gtmRisks.length;

    const severityColor = (severity?: string) => {
        if (severity === "high") return "bg-red-500/10 border-red-500/40 text-red-300";
        if (severity === "medium") return "bg-amber-500/10 border-amber-500/40 text-amber-200";
        if (severity === "low") return "bg-emerald-500/10 border-emerald-500/40 text-emerald-200";
        return "bg-zinc-800 border-zinc-700 text-zinc-200";
    };

    const renderRiskCard = (r: RiskItem, index: number) => (
        <div
            key={r.id || index}
            className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 shadow-sm space-y-2"
        >
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white">
                    {r.title || "Untitled risk"}
                </h4>
                {r.category && (
                    <Badge className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-300">
                        {r.category}
                    </Badge>
                )}
            </div>

            {r.description && (
                <p className="text-[12px] text-gray-200 leading-relaxed">
                    {r.description}
                </p>
            )}

            <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-center">
                    <p className="text-gray-500 uppercase tracking-wide text-[10px]">
                        Impact
                    </p>
                    <p className="text-white font-semibold text-sm">
                        {r.impact ?? "-"}
                    </p>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-center">
                    <p className="text-gray-500 uppercase tracking-wide text-[10px]">
                        Likelihood
                    </p>
                    <p className="text-white font-semibold text-sm">
                        {r.likelihood ?? "-"}
                    </p>
                </div>
                <div
                    className={cn(
                        "rounded-lg p-2 text-center border text-[11px]",
                        severityColor(r.severity)
                    )}
                >
                    <p className="uppercase tracking-wide text-[10px]">
                        Severity
                    </p>
                    <p className="font-semibold text-sm">
                        {r.severity ? r.severity.toUpperCase() : "-"}
                    </p>
                </div>
            </div>

            {r.mitigation && (
                <div className="mt-2 rounded-lg bg-zinc-900/70 border border-zinc-800 p-2">
                    <p className="text-[11px] text-gray-400 uppercase mb-1">
                        Mitigation
                    </p>
                    <p className="text-[12px] text-gray-200 leading-relaxed">
                        {r.mitigation}
                    </p>
                </div>
            )}

            {r.sourceHint && (
                <p className="text-[10px] text-gray-500 mt-1 italic">
                    Source: {r.sourceHint}
                </p>
            )}
        </div>
    );

    const hasAnyRisks = (arr: RiskItem[]) => arr && arr.length > 0;

    return (
        <div className="main relative flex h-full flex-col gap-4">
            {/* HEADER */}
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="scroll-m-20 text-3xl md:text-[32px] font-semibold tracking-tight text-white">
                        Risk Analysis
                    </h2>
                    <p className="text-sm md:text-[13px] text-gray-400 mt-1 leading-relaxed">
                        Dynamic risk map that evolves as you validate your problem, lock
                        the core, and approve GTM.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="bg-zinc-900 text-zinc-200 border-zinc-700 text-[11px] rounded-full px-3 py-1">
                        <Shield className="w-3 h-3 mr-1 inline-block text-emerald-400" />
                        {totalRisks} tracked risks
                    </Badge>
                </div>
            </header>

            <Separator className="bg-white/10" />

            {/* MAIN GRID */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                {/* LEFT: Sections per scope */}
                <div className="space-y-5 overflow-y-auto pr-1 pb-10">
                    {/* Problem-level risks */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    Problem-level risks
                                </h3>
                                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                                    Risks that question whether the problem is big, painful, and
                                    validated enough.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] border-zinc-700 text-zinc-300"
                            >
                                {problemRisks.length} items
                            </Badge>
                        </div>

                        {hasAnyRisks(problemRisks) ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {problemRisks.map(renderRiskCard)}
                            </div>
                        ) : (
                            <p className="text-[12px] text-gray-500 italic">
                                No problem-level risks generated yet. Validate your problem in
                                the Research view to populate this.
                            </p>
                        )}
                    </section>

                    {/* Core / solution risks */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    Core / solution risks
                                </h3>
                                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                                    Risks around your solution, business model, and core startup
                                    choices.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] border-zinc-700 text-zinc-300"
                            >
                                {coreRisks.length} items
                            </Badge>
                        </div>

                        {hasAnyRisks(coreRisks) ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {coreRisks.map(renderRiskCard)}
                            </div>
                        ) : (
                            <p className="text-[12px] text-gray-500 italic">
                                No core-level risks yet. Lock your core in Research and this
                                section will auto-populate.
                            </p>
                        )}
                    </section>

                    {/* GTM risks */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    GTM & growth risks
                                </h3>
                                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                                    Channel, acquisition, and growth risks once your GTM model is
                                    approved.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] border-zinc-700 text-zinc-300"
                            >
                                {gtmRisks.length} items
                            </Badge>
                        </div>

                        {hasAnyRisks(gtmRisks) ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {gtmRisks.map(renderRiskCard)}
                            </div>
                        ) : (
                            <p className="text-[12px] text-gray-500 italic">
                                GTM risks will appear after you approve GTM in the Research
                                view.
                            </p>
                        )}
                    </section>
                </div>

                {/* RIGHT: Summary / meta */}
                <aside className="space-y-4 pb-10">
                    {/* Overview card */}
                    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-900/70 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-sky-400" />
                                <h3 className="text-base font-semibold text-white">
                                    Avara Risk Overview
                                </h3>
                            </div>
                            <AlertTriangle className="w-4 h-4 text-amber-300" />
                        </div>
                        <p className="text-[12px] text-gray-300 leading-relaxed">
                            {summary ||
                                "As you move through problem validation, core lock, and GTM approval, this overview will summarise your current risk profile."}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                            Use this view together with Research to constantly balance{" "}
                            <span className="font-medium text-gray-300">opportunity</span> and{" "}
                            <span className="font-medium text-gray-300">downside.</span>
                        </p>
                    </div>

                    {/* Quick stats */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 text-[13px] text-gray-100 shadow-sm leading-relaxed">
                        <h3 className="text-base font-semibold text-white">
                            Quick snapshot
                        </h3>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                                <p className="text-[11px] text-gray-500 uppercase">
                                    Problem
                                </p>
                                <p className="text-lg font-semibold text-white">
                                    {problemRisks.length}
                                </p>
                            </div>
                            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                                <p className="text-[11px] text-gray-500 uppercase">
                                    Core
                                </p>
                                <p className="text-lg font-semibold text-white">
                                    {coreRisks.length}
                                </p>
                            </div>
                            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                                <p className="text-[11px] text-gray-500 uppercase">GTM</p>
                                <p className="text-lg font-semibold text-white">
                                    {gtmRisks.length}
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-center rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800 mt-1"
                            onClick={fetchRisk}
                        >
                            Refresh risk snapshot
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
