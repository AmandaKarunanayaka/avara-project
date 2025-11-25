import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import AvaraLoader from "@/components/AvaraLoader";
import AvaraAssistant from "@/components/AvaraAssistant";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Sparkles } from "lucide-react";
import AIWaveAnimation from "@/components/AIWaveAnimation";
import '../css/research.css';

/* ---------- Types ---------- */

type ResearchSection = {
    id: string;
    title: string;
    html?: string;
    kind?: string;
};

type ResearchExperiment = {
    id: string;
    title: string;
    hypothesis?: string;
    metric?: string;
    status?: string;
};

type ResearchSummary = {
    problem?: { state?: string; notes?: string };
    solution?: { state?: string; notes?: string };
    nextStep?: string;
    etaDays?: number;
    gtm?: {
        strategy?: string;
        summary?: string;
        channels?: string[];
        confidence?: number;
    };
};

type ResearchTimelineItem = {
    label: string;
    etaDays?: number;
};

type SPA = {
    sizeScore?: number;
    painScore?: number;
    accessibilityScore?: number;
    confidence?: number;
    commentary?: string;
};

type Persona = {
    id: string;
    type?: string;
    title?: string;
    description?: string;
    confidence?: number;
    updatedBy?: string;
    updatedAt?: string;
};

type Competitor = {
    name?: string;
    positioning?: string;
    strengths?: string;
    weaknesses?: string;
    overlap?: string;
};

type ReliabilityMeta = {
    reliabilityScore?: number;
    concerns?: string[];
    recommendedChecks?: string[];
    versionTag?: string;
};

type PESTBlock = {
    political?: string;
    economic?: string;
    social?: string;
    technological?: string;
    summary?: string;
};

type SWOTBlock = {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
};

type IndustryRecommendation = {
    recommendedIndustry?: string;
    alternatives?: string[];
    reasoning?: string;
};

type ProblemRefinement = {
    refinedProblem?: string;
    nicheHint?: string;
    riskFlags?: string[];
};

type ResearchMeta = {
    spa?: SPA;
    clarifyingQuestions?: string[];
    needMoreInput?: boolean;
    reliability?: ReliabilityMeta;
    pest?: PESTBlock;
    swot?: SWOTBlock;
    industryRecommendation?: IndustryRecommendation;
    problemRefinement?: ProblemRefinement;
    experimentHints?: string[];
};

type AnalysisBlock = {
    swot?: SWOTBlock;
    pest?: PESTBlock;
};

type Core = {
    problem?: { text?: string; state?: "draft" | "validated" };
    solution?: { text?: string; state?: "draft" | "validated" };
    personaPrimaryId?: string | null;
    locked?: boolean;
    dirtyDownstream?: boolean;
};

type Intake = {
    name?: string;
    industry?: string;
    region?: string;
    problem?: string;
    problemValidated?: boolean;
    solution?: string;
    solutionExists?: boolean;
    solutionValidated?: boolean;
    pathType?: "problem" | "resource";
    resourceDescription?: string;
    teamCount?: number;
    teamSkills?: string[];
};

type Gates = {
    problemValidationNeeded?: boolean;
    solutionValidationNeeded?: boolean;
    userApprovedExperiments?: boolean;
    userApprovedProceedToGTM?: boolean;
};

type ProjectContext = {
    state?: "draft" | "research" | "validation" | "gtm_ready" | "risk" | "roadmap";
    intake?: Intake;
    gates?: Gates;
};

type ResearchDoc = {
    projectId: string;
    pathType?: "problem" | "resource";
    sections?: ResearchSection[];
    experiments?: ResearchExperiment[];
    summary?: ResearchSummary;
    timeline?: ResearchTimelineItem[];
    meta?: ResearchMeta;
    personas?: Persona[];
    competitors?: Competitor[];
    analysis?: AnalysisBlock;
    intake?: Intake;
    core?: Core;
    state?: string;
};

const getToken = () => localStorage.getItem("token") || "";



/* ---------- Component ---------- */

export default function Research() {
    const { projectId } = useParams<{ projectId: string }>();

    const [doc, setDoc] = useState<ResearchDoc | null>(null);
    const [ctx, setCtx] = useState<ProjectContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyGate, setBusyGate] = useState<boolean>(false);


    // Enterprise Modals
    const [enterpriseModal, setEnterpriseModal] = useState<{
        isOpen: boolean;
        type: "problem" | "solution" | null;
    }>({ isOpen: false, type: null });

    const [savingCore, setSavingCore] = useState(false);
    const [validatingProblem, setValidatingProblem] = useState(false);

    // Helper to format section titles (remove underscores)
    const formatSectionTitle = (title: string) => {
        return title.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    // Clarifying modal for weak problem / niche
    const [clarifyOpen, setClarifyOpen] = useState(false);
    const [clarifyAnswer, setClarifyAnswer] = useState("");

    // Assistant control
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [triggerMessage, setTriggerMessage] = useState<string | undefined>(undefined);

    // New State for GTM and Modals
    const [showSPAModal, setShowSPAModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState<"swot" | "pest" | null>(null);
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
    const [isGtmApproved, setIsGtmApproved] = useState(false); // Local state for immediate UI update, ideally synced with backend


    const fetchResearch = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load research");
            const data = await res.json();
            setDoc(data.doc);
            setCtx(data.context);

            // Check if we need more input
            if (data.doc?.meta?.needMoreInput && data.doc?.meta?.clarifyingQuestions?.length > 0) {
                setClarifyOpen(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchResearch();
    }, [projectId]);

    const analyseRisk = async (scope: "problem" | "core" | "gtm") => {
        try {
            if (!projectId) return;
            const token = getToken();
            await fetch(`http://localhost:3005/risk/analyse`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projectId, scope }),
            });
            // We don't need the response here – Risk.tsx will read via GET /risk/:projectId
        } catch (err) {
            console.error("Error analysing risk:", err);
        }
    };

    const handleSelectPrimaryPersona = async (personaId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!doc) return;
        if (doc.core?.locked) return; // Prevent change if locked
        try {
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/core`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    projectId,
                    field: "persona_primary",
                    personaId
                })
            });

            if (!res.ok) throw new Error("Failed to set primary persona");
            const data = await res.json();
            setDoc(data.doc);
            setCtx(data.context);
        } catch (err) {
            console.error("Error selecting persona:", err);
            alert("Failed to select persona. Please try again.");
        }
    };

    const handleValidateProblem = async () => {
        if (!doc || !doc.core?.problem?.text) return;
        try {
            setValidatingProblem(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/core`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    projectId,
                    field: "problem",
                    text: doc.core.problem.text,
                    validate: true,
                }),
            });

            if (!res.ok) throw new Error("Failed to validate problem");
            const data = await res.json();
            setDoc(data.doc);
            setCtx(data.context);

            // 🔹 Kick off PROBLEM-SCOPE risk analysis in parallel
            analyseRisk("problem");

            // Poll for solution generation (since it's async)
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                if (attempts > 10) clearInterval(interval);
                await fetchResearch();
            }, 2000);
        } catch (err) {
            console.error("Error validating problem:", err);
            alert("Failed to validate problem");
        } finally {
            setValidatingProblem(false);
        }
    };

    const handleLockCore = async () => {
        if (!doc) return;
        try {
            setSavingCore(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/${projectId}/lock`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to lock core");
            const data = await res.json();
            setDoc(data.doc);
            setCtx(data.context);

            // 🔹 Kick off CORE-SCOPE risk analysis
            analyseRisk("core");
        } catch (err) {
            console.error(err);
            alert("Failed to lock core");
        } finally {
            setSavingCore(false);
        }
    };

    const handleApproveExperiments = async () => {
        if (!doc) return;
        try {
            setBusyGate(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/${projectId}/gate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ approveExperiments: true }),
            });
            if (!res.ok) throw new Error("Failed to approve experiments");
            // Re-fetch to get updated state
            setTimeout(() => fetchResearch(), 500);
        } catch (err) {
            console.error(err);
            alert("Failed to approve experiments");
        } finally {
            setBusyGate(false);
        }
    };

    const generateRoadmap = async () => {
        if (!projectId) return;
        const token = getToken();
        await fetch("http://localhost:3006/roadmap/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ projectId }),
        });
    };


    const generateCoreSetup = async () => {
        try {
            if (!projectId) return;
            const token = getToken();
            await fetch("http://localhost:3002/core/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projectId }),
            });
        } catch (err) {
            console.error("Error generating core setup:", err);
        }
    };

        const generateTaskpage = async () => {
        try {
            if (!projectId) return;
            const token = getToken();
            await fetch("http://localhost:3007/task/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projectId }),
            });
        } catch (err) {
            console.error("Error generating task setup:", err);
        }
    };


    const handleProceedToGTM = async () => {
        if (!doc) return;
        try {
            setBusyGate(true);
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/${projectId}/gate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ approveProceedToGTM: true }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Failed to proceed to GTM:", text);
                throw new Error(text || "Failed to proceed to GTM");
            }

            setIsGtmApproved(true);
            setTimeout(() => fetchResearch(), 500);

            // 🔹 Kick off GTM-SCOPE risk analysis (delayed to ensure DB consistency)
            setTimeout(() => analyseRisk("gtm"), 1000);
            setTimeout(() => generateCoreSetup(), 1000);
            setTimeout(() => generateRoadmap(), 1000);
            setTimeout(() => generateTaskpage(), 1000);

        } catch (err) {
            console.error(err);
        } finally {
            setBusyGate(false);
        }
    };

    const handleSubmitClarifications = async () => {
        if (!clarifyAnswer.trim()) return;
        try {
            const token = getToken();
            const res = await fetch(`http://localhost:3004/research/${projectId}/clarify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ answer: clarifyAnswer }),
            });

            if (!res.ok) throw new Error("Failed to submit clarification");

            const data = await res.json();
            setDoc(data.doc);
            if (data.context) setCtx(data.context);
            setClarifyOpen(false);
        } catch (err) {
            console.error(err);
            alert("Failed to submit answers");
        }
    };

    if (loading) return <AvaraLoader />;
    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-300 text-sm">
                    {error || "Research pack not found."}
                </p>
            </div>
        );
    }

    /* ---------- Derived State ---------- */
    const intake = doc?.intake || {};
    const core = doc?.core || {};
    const summary = doc?.summary || {};
    const meta = doc?.meta || {};
    const gates = ctx?.gates || {};
    const sections = doc?.sections || [];
    const experiments = doc?.experiments || [];
    const personas = doc?.personas || [];

    const reliability = meta.reliability;
    const industryRecommendation = meta.industryRecommendation;
    const problemRefinement = meta.problemRefinement;
    const clarifyingQuestions = meta.clarifyingQuestions || [];

    // Fix: SWOT/PEST might be in doc.analysis OR doc.meta depending on backend version
    const swot = doc?.analysis?.swot || meta.swot;
    const pest = doc?.analysis?.pest || meta.pest;

    const primaryPersona = personas.find((p) => p.id === core.personaPrimaryId);

    const problemValidated = core.problem?.state === "validated";
    const solutionValidated = core.solution?.state === "validated";
    const coreLocked = !!core.locked;
    const experimentsApproved = !!gates.userApprovedExperiments;
    const gtmApproved = !!gates.userApprovedProceedToGTM || isGtmApproved;

    // Before problem validation, hide all solution-related sections:
    // Solution Concept, How to Strengthen the Solution, Solution Validation Plan, etc.
    const filteredSections =
        (sections || []).filter((s) => {
            if (
                !problemValidated &&
                s.kind &&
                s.kind.startsWith("solution")
            ) {
                return false;
            }
            return true;
        });
    // Conditional Persona Roster: Show only if resource path OR problem path with NO solution provided
    const showPersonaRoster = doc?.pathType === "resource" || !intake.solutionExists;

    const stateLabel = ctx?.state ? ctx.state.toUpperCase() : "DRAFT";
    const stateBadgeClasses =
        ctx?.state === "validation"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700";

    /* ---------- Render ---------- */

    return (
        <div className="main relative flex h-full flex-col gap-4">
            {/* AI Loading Overlay */}
            {/* AI Loading Overlay Removed */}

            {/* HEADER */}
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="scroll-m-20 text-3xl md:text-[32px] font-semibold tracking-tight text-white">
                        {intake.name || "Project Analysis"}
                    </h2>
                    <p className="text-sm md:text-[13px] text-gray-400 mt-1 leading-relaxed">
                        {intake.industry ? `${intake.industry} · ` : ""}
                        {intake.region ? `${intake.region} · ` : ""}
                        {doc?.pathType === "resource"
                            ? "Resource-first strategy"
                            : "Problem-first strategy"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Badge className={stateBadgeClasses}>{stateLabel}</Badge>

                    {coreLocked && (
                        <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px] rounded-full px-3 py-1">
                            Core locked
                        </Badge>
                    )}

                    {experimentsApproved && (
                        <Badge className="border border-sky-500/40 bg-sky-500/10 text-sky-300 text-[11px] rounded-full px-3 py-1">
                            Experiments approved
                        </Badge>
                    )}
                </div>
            </header>

            <Separator className="bg-white/10" />

            {/* MAIN layout */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
                {/* LEFT: core triad + SPA + sections + experiments */}
                <div className="space-y-4 overflow-y-auto pr-1 pb-10">
                    {/* CORE TRIAD */}
                    <div className="grid gap-3 md:grid-cols-3">

                        {/* 1. Problem Card (User Input) */}
                        <div
                            className={cn(
                                "relative rounded-2xl border border-gray-800 bg-zinc-950 p-4 flex flex-col gap-2 shadow-sm transition-all duration-300 group overflow-hidden",
                                "hover:border-gray-700 hover:shadow-md hover:shadow-emerald-900/5"
                            )}
                        >
                            <AIWaveAnimation className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-emerald-500" />
                            <div className="relative z-10 flex flex-col h-full gap-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400">
                                            Problem (Your Input)
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            {problemValidated ? "Validated" : "Auto-validates on Core Lock"}
                                        </p>
                                    </div>
                                    <Sparkles className="w-4 h-4 text-sky-400" />
                                </div>
                                <p
                                    className="text-sm text-gray-100 mt-1 leading-relaxed line-clamp-4 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => setEnterpriseModal({ isOpen: true, type: "problem" })}
                                >
                                    {core.problem?.text || "No problem statement provided."}
                                </p>
                                <div className="mt-auto flex items-center justify-between gap-2">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-full border text-[11px]",
                                            problemValidated
                                                ? "border-emerald-500/60 text-emerald-300 bg-emerald-500/10"
                                                : "border-gray-700 text-gray-400"
                                        )}
                                    >
                                        {problemValidated ? "Validated" : "Draft"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Solution Card (User Input) */}
                        <div
                            className={cn(
                                "relative rounded-2xl border border-gray-800 bg-zinc-950 p-4 flex flex-col gap-2 shadow-sm transition-all duration-300 group overflow-hidden",
                                "hover:border-gray-700 hover:shadow-md hover:shadow-sky-900/5"
                            )}
                        >
                            <AIWaveAnimation className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-sky-500" />
                            <div className="relative z-10 flex flex-col h-full gap-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400">
                                            Solution (Your Input)
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            {solutionValidated ? "Validated" : "Auto-validates on Core Lock"}
                                        </p>
                                    </div>
                                    <Sparkles className="w-4 h-4 text-sky-400" />
                                </div>
                                <p
                                    className="text-sm text-gray-100 mt-1 leading-relaxed line-clamp-4 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => {
                                        if (problemValidated && core.solution?.text) {
                                            setEnterpriseModal({ isOpen: true, type: "solution" });
                                        }
                                    }}
                                >
                                    {!problemValidated || !core.solution?.text
                                        ? <span className="text-gray-500 italic">Avara will generate a solution after you validate the problem.</span>
                                        : core.solution.text
                                    }
                                </p>
                                <div className="mt-auto flex items-center justify-between gap-2">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-full border text-[11px]",
                                            solutionValidated
                                                ? "border-emerald-500/60 text-emerald-300 bg-emerald-500/10"
                                                : "border-gray-700 text-gray-400"
                                        )}
                                    >
                                        {solutionValidated ? "Validated" : "Draft"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Persona Selection (Conditional) */}
                        {showPersonaRoster && (
                            <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 flex flex-col gap-1 shadow-sm">
                                <div>
                                    <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                                        Target Persona
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mb-3">
                                        Select to refine solution
                                    </p>
                                </div>

                                <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1">
                                    {personas.length > 0 ? (
                                        personas.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!p.id) {
                                                        console.error("Persona missing ID:", p);
                                                        return;
                                                    }
                                                    handleSelectPrimaryPersona(p.id, e);
                                                }}
                                                className={cn(
                                                    "w-full text-left rounded-xl border p-2.5 transition group relative",
                                                    p.id === core.personaPrimaryId
                                                        ? "border-emerald-500/40 bg-emerald-500/10"
                                                        : "border-gray-800 bg-zinc-900 hover:bg-white/5 hover:border-gray-700"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={cn(
                                                        "text-[12px] font-medium",
                                                        p.id === core.personaPrimaryId ? "text-emerald-300" : "text-gray-200"
                                                    )}>
                                                        {p.title}
                                                    </p>
                                                    {p.id === core.personaPrimaryId && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-[11px] text-gray-500 italic">
                                            No personas generated yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* NEW: SPA & Analysis Cards (Below the top 3) */}

                    <div className="grid gap-3 md:grid-cols-2">
                        {/* SPA Card */}
                        <div
                            className="rounded-2xl border border-gray-800 bg-zinc-900 p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:border-gray-700 transition-colors"
                            onClick={() => setShowSPAModal(true)}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-sky-400" />
                                    <p className="text-xs uppercase tracking-wide text-gray-400">
                                        Market Fit (SPA)
                                    </p>
                                </div>
                                {meta.spa?.confidence && (
                                    <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-400">
                                        {Math.round(meta.spa.confidence * 100)}% Conf.
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="text-center p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                                    <div className="text-[10px] text-gray-500 uppercase">Size</div>
                                    <div className="text-lg font-semibold text-white">{meta.spa?.sizeScore ?? "-"}</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                                    <div className="text-[10px] text-gray-500 uppercase">Pain</div>
                                    <div className="text-lg font-semibold text-white">{meta.spa?.painScore ?? "-"}</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                                    <div className="text-[10px] text-gray-500 uppercase">Access</div>
                                    <div className="text-lg font-semibold text-white">{meta.spa?.accessibilityScore ?? "-"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Card (SWOT/PEST) */}
                        <div className="rounded-2xl border border-gray-800 bg-zinc-900 p-4 flex flex-col gap-2 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-wide text-gray-400">
                                    Strategic Analysis
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1 h-full">
                                <button
                                    disabled={!coreLocked}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 transition-colors",
                                        coreLocked
                                            ? "hover:bg-zinc-800"
                                            : "opacity-60 cursor-not-allowed"
                                    )}
                                    onClick={() => coreLocked && setShowAnalysisModal("swot")}
                                >
                                    <span className="text-sm font-semibold text-white">SWOT</span>
                                    <span className="text-[10px] text-gray-500">Strengths & Risks</span>
                                </button>
                                <button
                                    disabled={!coreLocked}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 transition-colors",
                                        coreLocked
                                            ? "hover:bg-zinc-800"
                                            : "opacity-60 cursor-not-allowed"
                                    )}
                                    onClick={() => coreLocked && setShowAnalysisModal("pest")}
                                >
                                    <span className="text-sm font-semibold text-white">PEST</span>
                                    <span className="text-[10px] text-gray-500">Macro Factors</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Research sections */}
                    {filteredSections.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="research-section">
                                    <h3 className="text-base font-semibold text-white">
                                        Research sections
                                    </h3>
                                    <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                                        Narrative view combining problem, solution, validation, and
                                        execution.
                                    </p>
                                </div>
                                <span className="text-[11px] text-gray-500">
                                    {filteredSections.length} sections
                                </span>
                            </div>

                            <div className="space-y-3">
                                {filteredSections.map((section) => (
                                    <article
                                        key={section.id}
                                        className="rounded-2xl border border-gray-800 bg-zinc-950 p-5 shadow-sm"
                                    >
                                        <h4 className="text-[15px] font-semibold text-white mb-1">
                                            {section.title}
                                        </h4>
                                        {section.kind && (
                                            <p className="text-[11px] uppercase tracking-wide text-sky-400 mb-2">
                                                {formatSectionTitle(section.kind)}
                                            </p>
                                        )}
                                        {section.html && (
                                            <div
                                                className="prose prose-invert prose-sm max-w-none mt-1 text-gray-100 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                                                dangerouslySetInnerHTML={{
                                                    __html: section.title
                                                        .toLowerCase()
                                                        .includes("solution improvements")
                                                        ? section.html
                                                            ?.replace(/(\d+\.)/g, "<br/><br/>$1")
                                                            .replace(/^<br\/><br\/>/, "") || ""
                                                        : section.html || "",
                                                }}
                                            />
                                        )}
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Competitors (Moved to Research Section) */}
                    {(doc?.competitors?.length || 0) > 0 && (
                        <div className="space-y-3">
                            <div className="comp-section flex items-center justify-between">
                                <h3 className="text-base font-semibold text-white">
                                    Competitor Landscape
                                </h3>
                                <span className="text-[11px] text-gray-500">
                                    {doc?.competitors?.length} detected
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {doc?.competitors?.map((comp, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 cursor-pointer hover:border-gray-600 transition-all"
                                        onClick={() => setSelectedCompetitor(comp)}
                                    >
                                        <h4 className="font-semibold text-white text-sm mb-1 truncate">{comp.name}</h4>
                                        <p className="text-[11px] text-gray-400 line-clamp-2 break-words">{comp.positioning}</p>
                                        {comp.overlap && (
                                            <Badge variant="secondary" className="mt-2 text-[10px] bg-zinc-800 text-zinc-300 whitespace-normal h-auto text-left leading-relaxed w-full block">
                                                <span className="font-semibold text-zinc-400">Overlap:</span> {comp.overlap}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GTM Section (Only if Approved) */}
                    {gtmApproved && summary.gtm && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="gtm-section text-base font-semibold text-white">
                                    Go-to-Market Strategy
                                </h3>
                                <Badge className="bg-gray-500/10 text-white-300 border-white-500/20">
                                    Ready to Launch
                                </Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {/* Strategy Summary */}
                                <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 col-span-2">
                                    <p className="text-xs uppercase tracking-wide text-white mb-2">Strategy</p>
                                    <p className="text-sm text-gray-200 leading-relaxed">{summary.gtm.strategy}</p>
                                    <p className="text-[12px] text-gray-400 mt-2">{summary.gtm.summary}</p>
                                </div>

                                {/* Channels */}
                                <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Channels</p>
                                    <div className="flex flex-wrap gap-2">
                                        {summary.gtm.channels?.map((ch, i) => (
                                            <Badge key={i} variant="outline" className="border-gray-700 text-gray-300">
                                                {ch}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Confidence */}
                                <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 flex flex-col justify-center items-center">
                                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Confidence</p>
                                    <div className="text-xl font-bold text-white">
                                        {summary.gtm.confidence ? Math.round(summary.gtm.confidence * 100) : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Experiments */}
                    {experiments.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="exp-section">
                                    <h3 className="text-base font-semibold text-white">
                                        Experiments
                                    </h3>
                                    <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                                        Evidence plans derived from your core problem, persona, and
                                        solution.
                                    </p>
                                </div>
                                <span className="text-[11px] text-gray-500">
                                    {experiments.length} experiments
                                </span>
                            </div>

                            <div className="space-y-3">
                                {experiments.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 text-sm shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-semibold text-white text-[14px]">
                                                {exp.title}
                                            </h4>
                                            {exp.status && (
                                                <Badge className="text-[10px] rounded-full border border-gray-700 bg-gray-900 text-gray-200 px-2 py-0.5">
                                                    {exp.status}
                                                </Badge>
                                            )}
                                        </div>
                                        {exp.hypothesis && (
                                            <p className="text-[12px] text-gray-200 mt-2 leading-relaxed">
                                                <span className="font-semibold">Hypothesis: </span>
                                                {exp.hypothesis}
                                            </p>
                                        )}
                                        {exp.metric && (
                                            <p className="text-[12px] text-gray-300 mt-1 leading-relaxed">
                                                <span className="font-semibold">Metric: </span>
                                                {exp.metric}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: AI overview + validation gate + personas list + downstream */}
                <aside className="space-y-4 pb-10">
                    {/* AI OVERVIEW / RISK WIDGET */}
                    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-900/70 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-sky-400" />
                                    <h3 className="text-base font-semibold text-white">
                                        Avara Overview
                                    </h3>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    SPA, reliability & persona suggestion. You can override
                                    anything.
                                </p>
                            </div>
                            {reliability && typeof reliability.reliabilityScore === "number" && (
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400">Reliability</p>
                                    <p className="text-[13px] font-semibold text-sky-300">
                                        {Math.round(reliability.reliabilityScore * 100)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {primaryPersona && (
                            <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                                <p className="text-[12px] font-semibold text-white mb-1">
                                    Avara-recommended primary: {primaryPersona.title}
                                </p>
                                <p className="text-[11px] text-sky-100 leading-relaxed">
                                    This is a starting point. If your real buyers look different,
                                    pick another persona below — the system will re-cross-check
                                    your problem & solution.
                                </p>
                            </div>
                        )}

                        {industryRecommendation && (
                            <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-3">
                                <p className="text-[11px] text-purple-200 font-semibold mb-1">
                                    Industry lens
                                </p>
                                <p className="text-[11px] text-gray-100">
                                    Recommended:{" "}
                                    <span className="font-semibold">
                                        {industryRecommendation.recommendedIndustry || "n/a"}
                                    </span>
                                </p>
                                {industryRecommendation.alternatives &&
                                    industryRecommendation.alternatives.length > 0 && (
                                        <p className="text-[11px] text-gray-300 mt-1">
                                            Alternatives:{" "}
                                            {industryRecommendation.alternatives.join(", ")}
                                        </p>
                                    )}
                                {industryRecommendation.reasoning && (
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                        {industryRecommendation.reasoning}
                                    </p>
                                )}
                            </div>
                        )}

                        {reliability && reliability.concerns && reliability.concerns.length > 0 && (
                            <div className="rounded-xl border border-amber-500/40 bg-amber-900/10 p-3">
                                <p className="text-[11px] text-amber-300 font-semibold mb-1">
                                    Warnings & blind spots
                                </p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {reliability.concerns.slice(0, 3).map((c, idx) => (
                                        <li
                                            key={idx}
                                            className="text-[11px] text-amber-100 leading-relaxed"
                                        >
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-[10px] text-amber-300 mt-1">
                                    Always ground AI suggestions with real customer signals.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Validation gate */}
                    <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 space-y-4 shadow-sm">
                        <h3 className="text-base font-semibold text-white">
                            Validation & gate
                        </h3>
                        <p className="text-[12px] text-gray-400 leading-relaxed">
                            We only move into market & GTM once the core is solid and your
                            experiments are approved.
                        </p>

                        <div className="space-y-2 text-[12px] text-gray-200 mt-2">
                            <div className="flex items-center justify-between">
                                <span>Problem validation needed</span>
                                <span className="font-medium">
                                    {gates.problemValidationNeeded ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Solution validation needed</span>
                                <span className="font-medium">
                                    {gates.solutionValidationNeeded ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Core locked</span>
                                <span className="font-medium">
                                    {coreLocked ? "Yes" : "Not yet"}
                                </span>
                            </div>
                        </div>

                        <Separator className="bg-white/10" />

                        <div className="space-y-2">
                            <p className="text-[12px] text-gray-300 leading-relaxed">
                                Once you’re comfortable with the experiment plan, approve it to
                                move into{" "}
                                <span className="font-semibold text-white">Validation</span> and
                                unlock competitor and GTM views.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    className={cn(
                                        "w-full justify-center rounded-full font-medium transition-all",
                                        experimentsApproved
                                            ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/60"
                                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                                    )}
                                    disabled={
                                        busyGate ||
                                        (!coreLocked && !primaryPersona) ||
                                        (experimentsApproved && gtmApproved)
                                    }
                                    onClick={
                                        coreLocked
                                            ? (experimentsApproved ? handleProceedToGTM : handleApproveExperiments)
                                            : (problemValidated ? handleLockCore : handleValidateProblem)
                                    }
                                >

                                    {experimentsApproved
                                        ? (gtmApproved ? "GTM Unlocked" : "Proceed to GTM")
                                        : coreLocked
                                            ? "Approve & Move Forward"
                                            : problemValidated
                                                ? (savingCore ? "Locking..." : "Lock Core")
                                                : (validatingProblem ? "Validating..." : "Validate Problem")
                                    }
                                </Button>


                                {!experimentsApproved && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full justify-center rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        onClick={() => {
                                            setTriggerMessage("I'm not satisfied with the current plan. How can we improve it?");
                                            setAssistantOpen(true);
                                        }}
                                    >
                                        Not Satisfied
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Next step & GTM (only after core locked + experiments approved) */}
                    {experimentsApproved && (
                        <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 space-y-3 text-[13px] text-gray-100 shadow-sm leading-relaxed">
                            <h3 className="text-base font-semibold text-white mb-1">
                                Next step
                            </h3>
                            <p>
                                {summary.nextStep ||
                                    "Proceed to validate your experiments in the real world."}
                            </p>
                            {summary.etaDays && (
                                <p className="text-gray-400">ETA: {summary.etaDays} days</p>
                            )}
                        </div>
                    )}

                    {/* Competitors removed from here (moved to main column) */}


                    {/* Timeline (only downstream) */}
                    {experimentsApproved && (doc?.timeline?.length || 0) > 0 && (
                        <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-4 space-y-3 text-[13px] text-gray-100 shadow-sm leading-relaxed">
                            <h3 className="text-base font-semibold text-white">
                                High-level timeline
                            </h3>
                            <ul className="space-y-2">
                                {doc?.timeline?.map((t, idx) => (
                                    <li key={idx} className="flex justify-between">
                                        <span className="text-gray-300">{t.label}</span>
                                        {t.etaDays && (
                                            <span className="text-gray-500">{t.etaDays}d</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            {/* Enterprise Definition Modal */}
            <Dialog
                open={enterpriseModal.isOpen}
                onOpenChange={(open) => setEnterpriseModal({ ...enterpriseModal, isOpen: open })}
            >
                <DialogContent className="bg-[#09090b]/95 backdrop-blur-md border border-white/10 max-w-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            {enterpriseModal.type === "problem" ? "Enterprise Problem Definition" : "Enterprise Solution Definition"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-400">
                            Refined by Avara for clarity, impact, and enterprise standards.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {/* User Input Section */}
                        <div className="rounded-xl bg-zinc-900/50 p-4 border border-white/5">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                                Your Input
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {enterpriseModal.type === "problem"
                                    ? (intake.problem || "No input provided.")
                                    : (intake.solution || "No input provided.")
                                }
                            </p>
                        </div>

                        {/* Enterprise Definition Section */}
                        <div className="rounded-xl bg-white/5 p-6 border border-white/5">
                            <p className="text-xs uppercase tracking-wide text-emerald-400/80 mb-2">
                                Enterprise Definition
                            </p>
                            <p className="text-[15px] text-zinc-100 leading-relaxed font-medium">
                                {enterpriseModal.type === "problem"
                                    ? (problemRefinement?.refinedProblem || core.problem?.text || "Analysis in progress...")
                                    : (summary.solution?.notes || core.solution?.text || "Analysis in progress...")
                                }
                            </p>
                            {/* Only show if refined text is different from user input */}
                            {(enterpriseModal.type === "problem" && (problemRefinement?.refinedProblem === intake.problem || !problemRefinement?.refinedProblem)) ||
                                (enterpriseModal.type === "solution" && (summary.solution?.notes === intake.solution || !summary.solution?.notes))
                                ? <p className="text-xs text-gray-500 mt-2 italic">No significant refinement needed.</p>
                                : null
                            }
                        </div>

                        {enterpriseModal.type === "problem" && problemRefinement?.nicheHint && (
                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                                <p className="text-xs text-amber-200 font-medium mb-1">Strategic Niche Hint</p>
                                <p className="text-sm text-amber-100">{problemRefinement.nicheHint}</p>
                            </div>
                        )}

                        {/* Edit button removed as per user request - rely on AI refinement */}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Clarifying Questions Modal */}
            <Dialog
                open={clarifyOpen}
                onOpenChange={(open) => {
                    if (!meta.needMoreInput) setClarifyOpen(open);
                }}
            >
                <DialogContent className="bg-[#09090b] border border-white/10 max-w-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-semibold tracking-tight">
                            Let’s sharpen the focus
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-400">
                            Your problem statement or niche is a bit broad. Avara needs a few specifics to build a high-quality research pack.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 max-h-60 overflow-y-auto rounded-xl bg-white/5 p-4 border border-white/5">
                        {clarifyingQuestions.map((q, idx) => (
                            <div key={idx} className="flex gap-3">
                                <span className="text-emerald-400 font-mono text-xs mt-0.5">0{idx + 1}</span>
                                <p className="text-[13px] text-zinc-200 leading-relaxed">
                                    {q}
                                </p>
                            </div>
                        ))}
                    </div>

                    <Textarea
                        value={clarifyAnswer}
                        onChange={(e) => setClarifyAnswer(e.target.value)}
                        rows={5}
                        placeholder="Type your answers here..."
                        className="mt-4 bg-black/40 border-white/10 text-sm text-zinc-100 focus-visible:ring-emerald-500/50 placeholder:text-zinc-600"
                    />

                    <DialogFooter className="mt-4 flex justify-between gap-2 items-center">
                        {!meta.needMoreInput && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                onClick={() => setClarifyOpen(false)}
                            >
                                Skip for now
                            </Button>
                        )}
                        <div className="flex-1"></div>
                        <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6"
                            disabled={!clarifyAnswer.trim()}
                            onClick={handleSubmitClarifications}
                        >
                            Submit Answers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Avara Assistant Chat */}
            <AvaraAssistant
                service="research"
                projectId={projectId!}
                clarifyingQuestions={clarifyingQuestions}
                onDocUpdated={(newDoc) => {
                    setDoc(newDoc);
                    if (newDoc.context) setCtx(newDoc.context);
                }}
                isOpen={assistantOpen}
                onOpenChange={setAssistantOpen}
                triggerMessage={triggerMessage}
            />

            {/* SPA Commentary Modal */}
            <Dialog open={showSPAModal} onOpenChange={setShowSPAModal}>
                <DialogContent className="bg-[#09090b] border border-white/10 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-sky-400" />
                            SPA Analysis
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
                                <div className="text-xs text-gray-500 uppercase">Size</div>
                                <div className="text-xl font-bold text-white">{meta.spa?.sizeScore}</div>
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
                                <div className="text-xs text-gray-500 uppercase">Pain</div>
                                <div className="text-xl font-bold text-white">{meta.spa?.painScore}</div>
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
                                <div className="text-xs text-gray-500 uppercase">Access</div>
                                <div className="text-xl font-bold text-white">{meta.spa?.accessibilityScore}</div>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {meta.spa?.commentary || "No commentary available."}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Analysis Modal (SWOT/PEST) */}
            <Dialog open={!!showAnalysisModal} onOpenChange={(open) => !open && setShowAnalysisModal(null)}>
                <DialogContent className="bg-[#09090b] border border-white/10 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {showAnalysisModal === "swot" ? "SWOT Analysis" : "PEST Analysis"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        {showAnalysisModal === "swot" && swot && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-emerald-400 font-medium text-sm">Strengths</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                        {swot.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-amber-400 font-medium text-sm">Weaknesses</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                        {swot.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sky-400 font-medium text-sm">Opportunities</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                        {swot.opportunities?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-red-400 font-medium text-sm">Threats</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                        {swot.threats?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {showAnalysisModal === "pest" && pest && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-300">{pest.summary}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-xs text-gray-500 uppercase">Political</span>
                                        <p className="text-xs text-gray-300 mt-1">{pest.political}</p>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-xs text-gray-500 uppercase">Economic</span>
                                        <p className="text-xs text-gray-300 mt-1">{pest.economic}</p>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-xs text-gray-500 uppercase">Social</span>
                                        <p className="text-xs text-gray-300 mt-1">{pest.social}</p>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-xs text-gray-500 uppercase">Technological</span>
                                        <p className="text-xs text-gray-300 mt-1">{pest.technological}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Competitor Modal */}
            <Dialog open={!!selectedCompetitor} onOpenChange={(open) => !open && setSelectedCompetitor(null)}>
                <DialogContent className="bg-[#09090b] border border-white/10 max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">{selectedCompetitor?.name}</DialogTitle>
                        <DialogDescription>{selectedCompetitor?.positioning}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20">
                                <h4 className="text-emerald-400 text-xs font-bold uppercase mb-2">Strengths</h4>
                                <p className="text-xs text-gray-300">{selectedCompetitor?.strengths || "N/A"}</p>
                            </div>
                            <div className="bg-red-900/10 p-3 rounded-lg border border-red-500/20">
                                <h4 className="text-red-400 text-xs font-bold uppercase mb-2">Weaknesses</h4>
                                <p className="text-xs text-gray-300">{selectedCompetitor?.weaknesses || "N/A"}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-1">Overlap</h4>
                            <p className="text-sm text-white">{selectedCompetitor?.overlap || "None"}</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
