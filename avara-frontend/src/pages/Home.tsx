import type { SVGProps } from "react";
import type { JSX } from "react/jsx-runtime";
import "../css/home.css";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/** ---- Types ---- */
type Project = {
  projectId: string;
  name: string;
  industry?: string;
  status?: "draft" | "research" | "validation" | "gtm_ready";
  updatedAt?: string;
  coverEmoji?: string;
  coverHue?: number;
};

const getToken = () => localStorage.getItem("token") || "";

function hashToHue(input: string, seed = 1315423911): number {
  let h = seed;
  for (let i = 0; i < input.length; i++) {
    h ^= (h << 5) + input.charCodeAt(i) + (h >> 2);
  }
  return Math.abs(h) % 360;
}

function MinimalDropdown({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="filter-trigger"
      >
        {options.find(o => o.value === value)?.label || "Select"}
        <span className="caret">▾</span>
      </button>

      {open && (
        <div className="filter-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`filter-item ${opt.value === value ? "active" : ""
                }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function emojiFor(industry?: string, fallback = "📁") {
  const key = (industry || "").toLowerCase();
  if (key.includes("ed")) return "🎓";
  if (key.includes("fin")) return "💳";
  if (key.includes("health")) return "🏥";
  if (key.includes("ai")) return "🤖";
  if (key.includes("travel")) return "🧭";
  return fallback;
}

function gradient(h = 210) {
  const h2 = (h + 25) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${h2} 70% 45%))`;
}

/** ---- Card ---- */
function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) {
  const hue = project.coverHue ?? hashToHue(`${project.name}|${project.industry || ""}`);
  const cover = useMemo(() => gradient(hue), [hue]);
  const emoji = project.coverEmoji || emojiFor(project.industry);

  return (
    <div
      role="button"
      onClick={() => onOpen(project)}
      className="group aspect-[16/10] overflow-hidden rounded-xl border hover:shadow-lg transition"
    >
      <div className="h-[32%] relative" style={{ background: cover }}>
        <div className="absolute inset-0 flex items-center justify-end pr-3">
          <div className="text-2xl drop-shadow">{emoji}</div>
        </div>
      </div>

      <div className="p-3 flex flex-col h-[68%]">
        <div className="font-semibold leading-tight line-clamp-2">{project.name}</div>
        <div className="text-xs mt-1 line-clamp-1">{project.industry || "—"}</div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] px-2 py-0.5 rounded border capitalize">
            {(project.status || "draft").replace("_", " ")}
          </span>
          <div className="text-[10px]">
            {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---- Page ---- */
export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false); // 🔹 new
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "research" | "validation" | "gtm_ready">("all");

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // 🔹 if logged in and not verified, show verify modal
    const emailVerified = localStorage.getItem("emailVerified");
    if (emailVerified !== "true") {
      setShowVerifyModal(true);
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:3004/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = (await res.json()) as any[];
        const mapped: Project[] = items.map((d) => ({
          projectId: d.projectId,
          name: d.name,
          industry: d.industry,
          status: (d.status || "draft") as Project["status"],
          updatedAt: d.updatedAt || d.createdAt || undefined,
          coverEmoji: d.coverEmoji,
          coverHue: d.coverHue,
        }));
        setProjects(mapped);
      } catch (e) {
        console.error("Failed to load projects:", e);
      }
    })();
  }, []);

  /** derived: search + filter */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const statusOk = statusFilter === "all" ? true : (p.status || "draft") === statusFilter;
      const textOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.industry || "").toLowerCase().includes(q);
      return statusOk && textOk;
    });
  }, [projects, query, statusFilter]);

  const openProject = (p: Project) => {
    if ((p.status || "draft") === "draft") {
      navigate("/question", {
        state: {
          startupName: p.name,
          projectId: p.projectId,
        },
      });
    } else {
      navigate(`/research/${p.projectId}`);
    }
  };

  /** create project → add optimistic card → go to questions */
  const createProject = async () => {
    const token = getToken();
    if (!token) return alert("Please login first.");
    const name = projectName.trim();
    if (!name) return;

    const projectId = crypto.randomUUID();

    try {
      const res = await fetch("http://localhost:3004/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, name }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("Create project failed:", t);
        alert("Failed to create project");
        return;
      }

      setProjects((prev) => [
        { projectId, name, status: "draft", updatedAt: new Date().toISOString() },
        ...prev,
      ]);

      setShowModal(false);
      setProjectName("");
      navigate("/question", { state: { startupName: name, projectId } });
    } catch (e) {
      console.error("Create project error:", e);
      alert("Failed to create project");
    }
  };

  const handleEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && projectName.trim() !== "") {
      await createProject();
    }
  };

  return (
    <>
      <div
        className={`flex flex-col gap-4 h-full content ${
          showModal || showVerifyModal ? "blur-sm" : ""
        }`}
      >
        {/* hero */}
        <section className="main-content">
          <div className="header">
            <h1 className="scroll-m-20 text-center text-4xl tracking-tight text-balance heading">
              Automate. Accelerate. Escape.
            </h1>
          </div>

          {/* search */}
          <div className="searchbar">
            <div className="flex items-center w-full max-w-lg space-x-2 border px-3.5 py-2 search-bar">
              <SearchIcon className="h-4 w-4 icon" />
              <Input
                type="search"
                placeholder="Search"
                className="w-full border-0 h-8 font-semibold search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* header row: title + filter */}
        <section className="mx-2 md:mx-0 mt-2 flex items-center justify-between">
          <h2 className="pl-1 text-lg md:text-xl font-semibold text-white/90">Your projects</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="status" className="text-xs text-white/60">
              Filter:
            </label>
            <MinimalDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: "all", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "research", label: "Research" },
                { value: "validation", label: "Validation" },
                { value: "gtm_ready", label: "GTM Ready" },
              ]}
            />
          </div>
        </section>

        {/* grid */}
        <div className="content-cards">
          <motion.div
            layout
            className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]"
          >
            <motion.div
              layout
              className="aspect-[16/10] rounded-xl bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted transition border"
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="h-10 w-10 text-black" />
            </motion.div>

            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div
                  key={p.projectId}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <ProjectCard project={p} onOpen={openProject} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <p className="text-sm text-white/60 mt-2">No projects match your filter.</p>
          )}
        </div>
      </div>

      {/* existing New Project modal */}
      {showModal && (
        <div className="input-box fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-black rounded-xl p-6 w-[90%] max-w-md shadow-xl text-white">
            <h2 className="text-xl font-semibold mb-4">New Project</h2>
            <Input
              type="text"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleEnter}
              className="mb-6 bg-gray-800 text-white border border-white/70"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="w-32 px-4 py-2 rounded-lg bg-transparent border border-white/80 hover:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={createProject}
                className="w-32 px-4 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 verify email modal */}
      {showVerifyModal && (
        <div className="input-box fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-black rounded-xl p-6 w-[90%] max-w-md shadow-xl text-white">
            <h2 className="text-xl font-semibold mb-4">Verify your email</h2>
            <p className="text-sm text-white/80 mb-4">
              We&apos;ve sent a verification email to your inbox. Please confirm your email to
              enjoy the full Avara experience.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.open("https://mail.google.com", "_blank")}
                className="w-32 px-4 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Open Gmail
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-32 px-4 py-2 rounded-lg bg-transparent border border-white/80 hover:bg-white/10"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** icons */
function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PlusIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
