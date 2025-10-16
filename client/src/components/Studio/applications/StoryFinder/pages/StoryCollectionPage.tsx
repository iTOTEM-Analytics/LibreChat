// StoryProjectPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBreadcrumb } from "../../Layout/BreadcrumbContext";
import { type StoryCollection, getProjects } from "../services/projectsApi";
import StoryDataModal from "../components/StoryCandidateSetupModal";
import DeleteConfirmCandidateDataModal from "../components/DeleteConfirmCandidateDataModal";
import GenerateAllConfirmationModal from "../components/GenerateAllConfirmationModal";
import InsightCards from "../components/InsightCards";
import DiscoveryProgress from "../components/DiscoveryProgress";
import CandidateTable from "../components/CandidateTable";
import {
  startRunApi,
  listCandidatesApi,
  clearCandidatesApi,
  openEvents,
  type Candidate as ApiCandidate,
  cancelRun,
} from "../../../api/storyfinder";
import api from "../../../api/axios";

type Candidate = {
  id: string;
  name: string;
  location?: string;
  score: number | undefined;
  description?: string;
  generateStory?: string | number | "Not generated";
};

function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

export default function StoryProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setOverride } = useBreadcrumb();

  const [project, setProject] = useState<StoryCollection | null>(null);
  const [loading, setLoading] = useState(true);

  // discovery run control
  const [running, setRunning] = useState(false);
  const [runStartAt, setRunStartAt] = useState<number | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [esRef, setEsRef] = useState<EventSource | null>(null);

  const [stages, setStages] = useState<{ label: string; done: boolean }[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [initialRowsCount, setInitialRowsCount] = useState<number | null>(null); // Vendors scanned

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openGenerateAllModal, setOpenGenerateAllModal] = useState(false);

  const quotaTotal = 10;
  const [quotaRemaining, setQuotaRemaining] = useState(quotaTotal);
  const quotaPct = Math.round((quotaRemaining / quotaTotal) * 100);

  // initial load: project + existing candidates + initial rows count (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const all = await getProjects();
        const p = all.find((x) => x.id === id) || null;
        setProject(p);
        setOverride?.(p ? trunc(p.name, 25) : "Story Collection");

        if (id) {
          const existing = await listCandidatesApi(id);
          setCandidates(existing.map(mapToUi));

          // Try optional backend initial rows endpoint; else fallbacks.
          const base = (api.defaults.baseURL || "http://localhost:8787/api/v1").replace(/\/$/, "");
          try {
            const resp = await fetch(`${base}/storyfinder/initial?projectId=${encodeURIComponent(id)}`, {
              credentials: "include",
              headers: { "X-User-Id": localStorage.getItem("itotem_user") || "demo@local" },
            });
            if (resp.ok) {
              const data = await resp.json(); // { rows: [...] }
              if (Array.isArray(data?.rows)) setInitialRowsCount(data.rows.length);
              else setInitialRowsCount(Number(localStorage.getItem(`sf_initial_count:${id}`)) || existing.length || 0);
            } else {
              setInitialRowsCount(Number(localStorage.getItem(`sf_initial_count:${id}`)) || existing.length || 0);
            }
          } catch {
            setInitialRowsCount(Number(localStorage.getItem(`sf_initial_count:${id}`)) || existing.length || 0);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => setOverride?.("");
  }, [id, setOverride]);

  useEffect(() => {
    return () => { esRef?.close(); };
  }, [esRef]);

  function mapToUi(a: ApiCandidate): Candidate {
    const loc = [a.city || "", a.province || ""].filter(Boolean).join(", ");
    const score = typeof a.candidate_score === "number" ? a.candidate_score : undefined;
    return { id: a.id, name: a.vendor_name || "", location: loc || undefined, score, description: a.description || undefined, generateStory: "Not generated" };
  }

  // insights (realistic)
  const insightCards = useMemo(() => {
    const count = candidates.length;
    const numericScores = candidates.map((c) => c.score).filter((n): n is number => typeof n === "number");
    const avg = numericScores.length ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : null;
    const top80 = numericScores.length ? numericScores.filter((n) => n >= 80).length : null;
    const scanned = initialRowsCount;

    return [
      { label: "Story candidates", value: count },
      { label: "Avg. score", value: avg === null ? "—" : avg },
      { label: "Top scores (≥80)", value: top80 === null ? "—" : top80 },
      { label: "Vendors scanned", value: (scanned ?? "—") as any },
    ];
  }, [candidates, initialRowsCount]);

  // start discovery
  const startRun = async (payload: {
    vendors: string[];
    instruction: string;
    sourceLabel: string;
    limit: number;
    preferRecent: boolean;
    focus: "innovation" | "sustainability" | "growth";
    locationTarget?: string;
    criteriaMode?: "auto" | "public";
    meta?: { sourceMode: "upload" | "existing" | "manual"; vendorCol?: string; cityCol?: string; provinceCol?: string };
    rows?: Record<string, any>[];
  }) => {
    if (!id) return;

    // set “vendors scanned”
    const scanned = payload.vendors.length;
    setInitialRowsCount(scanned);
    localStorage.setItem(`sf_initial_count:${id}`, String(scanned));

    setOpenModal(false);
    setRunning(true);
    setRunStartAt(Date.now());
    setStages([
      { label: "Finding initial vendor set", done: false },
      { label: "Scoring & ranking", done: false },
      { label: "Finalizing candidate list", done: false },
    ]);
    // reset table to show skeleton during run if you want a clean start
    // setCandidates([]);

    const body = {
      projectId: id,
      source: {
        mode: payload.meta?.sourceMode || "manual",
        vendorCol: payload.meta?.vendorCol,
        cityCol: payload.meta?.cityCol,
        provinceCol: payload.meta?.provinceCol,
        fileLabel: payload.sourceLabel,
        rows: payload.meta?.sourceMode === "manual" ? undefined : payload.rows,
        manual:
          payload.meta?.sourceMode === "manual"
            ? payload.vendors.map((v) => {
                const [name, loc] = v.split("|").map((s) => s.trim());
                return { name, location: loc || undefined };
              })
            : undefined,
      },
      locationBias: payload.locationTarget,
      criteriaMode: payload.criteriaMode || "auto",
      focus: payload.focus,
      limit: payload.limit,
    } as const;

    const { jobId } = await startRunApi(body);
    setCurrentJobId(jobId);

    const es = openEvents(jobId);
    setEsRef(es);

    es.addEventListener("stage", (e: any) => {
      const d = JSON.parse(e.data);
      setStages((s) =>
        s.map((x) =>
          (d.stage === "preprocess" && x.label.includes("Finding")) ||
          (d.stage === "rank" && x.label.includes("Scoring")) ||
          (d.stage === "finalize" && x.label.includes("Finalizing"))
            ? { ...x, done: !!d.done }
            : x
        )
      );
    });

    es.addEventListener("partial", (e: any) => {
      const d = JSON.parse(e.data) as { batch: ApiCandidate[]; batchIndex: number };
      setCandidates((prev) => [...d.batch.map(mapToUi), ...prev]);
    });

    // Phase-2 enrichment updates in-place
    es.addEventListener("enriched", (e: any) => {
      const d = JSON.parse(e.data) as { batch: ApiCandidate[]; batchIndex: number };
      const updates = d.batch.map(mapToUi);
      setCandidates((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]));
        for (const u of updates) {
          const cur = map.get(u.id);
          map.set(u.id, cur ? { ...cur, ...u } : u);
        }
        return Array.from(map.values());
      });
    });

    const finishAfterMinDelay = () => {
      const started = runStartAt || Date.now();
      const elapsed = Date.now() - started;
      const minMs = 2000; // ensure 2s minimum discover UI
      const wait = Math.max(0, minMs - elapsed);
      setTimeout(() => { setRunning(false); }, wait);
      es.close();
      setEsRef(null);
      setCurrentJobId(null);
    };

    es.addEventListener("done", () => finishAfterMinDelay());
    es.addEventListener("cancelled", () => finishAfterMinDelay());
    es.addEventListener("error", () => finishAfterMinDelay());
  };

  const title = useMemo(() => (project ? project.name : "Story Collection"), [project]);
  const desc = useMemo(() => {
    const d = project?.description?.trim() || "";
    return d.length > 250 ? d.slice(0, 250) + "…" : d;
  }, [project]);

  return (
    <div className="px-4 sm:px-6">
      {/* Top controls */}
      <div className="flex items-center justify-between mb-4">
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800" onClick={() => navigate("/studio/storyfinder")}>
          <ArrowLeft className="w-4 h-4" /> Back to Collections List
        </button>
        <button onClick={() => setOpenModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-2 shadow-sm hover:bg-teal-600">
          Add Data
        </button>
      </div>

      {/* Overview / Insights */}
      <section className="rounded-2xl bg-white/90 ring-1 ring-slate-200 shadow-sm p-5 mb-6">
        {loading ? (
          <div className="space-y-4" style={pulseStyle}>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="mt-4 h-2 bg-gray-100 rounded"></div>
            <div className="mt-4 grid sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-600">{title}</div>
                {project?.description ? (
                  <div className="mt-1 text-sm text-gray-500">
                    {desc}{" "}
                    {project.description.length > 250 && (
                      <span className="text-slate-500 underline decoration-dotted cursor-help" title={project.description}>show more</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-400">No description.</div>
                )}    
              </div>

              {/* Quota */}
              <div className="min-w-[240px]">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Story generation quota</span>
                  <span>{quotaRemaining}/{quotaTotal}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${quotaRemaining === 0 ? "bg-red-500" : quotaRemaining <= 3 ? "bg-orange-500" : "bg-teal-700"}`} style={{ width: `${quotaPct}%` }} />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {quotaRemaining === 0 ? "Quota reached" : quotaRemaining <= 3 ? `${quotaRemaining} remaining (low)` : `${quotaRemaining} remaining`}
                </div>
              </div>
            </div>

            {/* Insights */}
            {candidates.length === 0 ? (
              <div className="mt-6 flex items-center justify-center text-sm text-gray-500 p-6 rounded-xl ring-1 ring-slate-200">
                Add data to view insights and candidate list.
              </div>
            ) : (
              <InsightCards cards={insightCards} />
            )}
          </>
        )}
      </section>

      {/* Candidate Discovery Progress */}
      <DiscoveryProgress
        stages={stages}
        running={running}
        onStop={async () => {
          if (currentJobId) {
            try { await cancelRun(currentJobId); } catch {}
            esRef?.close();
            setRunning(false);
            setEsRef(null);
            setCurrentJobId(null);
          }
        }}
        onClose={() => !running && setStages([])}
      />

      {/* Candidates table */}
      <CandidateTable
        candidates={candidates}
        running={running}
        quotaRemaining={quotaRemaining}
        onViewCandidate={(candidateId) => navigate(`/studio/storyfinder/${id}/candidate/${candidateId}`)}
        onGenerateAll={() => setOpenGenerateAllModal(true)}
        onDeleteAll={() => setOpenDeleteModal(true)}
      />

        {/* Confirm delete modal */}
        {openDeleteModal && (
          <DeleteConfirmCandidateDataModal
            open={openDeleteModal}
            onClose={() => setOpenDeleteModal(false)}
            onConfirm={async () => {
              if (!id) return;
              await clearCandidatesApi(id);
              setCandidates([]);
              setOpenDeleteModal(false);
            }}
          />
        )}

        {/* Generate-all modal */}
        {openGenerateAllModal && (
          <GenerateAllConfirmationModal
            open={openGenerateAllModal}
            onClose={() => setOpenGenerateAllModal(false)}
            onConfirm={async () => {
              const n = candidates.length;
              setCandidates(prev => prev.map(c => ({ ...c, generateStory: "Generating…" })));
              setQuotaRemaining(prev => Math.max(0, prev - n));
            }}
            candidatesCount={candidates.length}
            quotaRemaining={quotaRemaining}
          />
        )}
      </section>

      {/* Add Data modal */}
      {openModal && (
        <StoryDataModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          defaultProject={project?.connectedProject || ""}
          onStart={startRun}
        />
      )}
    </div>
  );
}
