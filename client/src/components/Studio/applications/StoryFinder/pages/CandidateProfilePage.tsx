import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Globe, MapPin, Award, Users, FileText, Wand2,
  RotateCcw, Loader2, Check, ChevronRight, Info,
  Sparkles
} from "lucide-react";
import { listCandidatesApi, type Candidate } from "../../../api/storyfinder";

type StoryState = "idle" | "running" | "done" | "error";

const STAGES = [
  "Fetching source data",
  "Aggregating information",
  "Drafting the narrative",
  "Polishing assets",
  "Final review and output",
] as const;

function getPersistKey(projectId: string, cid: string) {
  return `sf:story:${projectId}:${cid}`;
}
function readPersistedStory(projectId: string, cid: string): { state: StoryState; count: number } {
  try {
    const raw = localStorage.getItem(getPersistKey(projectId, cid));
    if (!raw) return { state: "idle", count: 0 };
    const j = JSON.parse(raw);
    return { state: (j.state as StoryState) || "idle", count: Number.isFinite(j.count) ? j.count : 0 };
  } catch {
    return { state: "idle", count: 0 };
  }
}
function writePersistedStory(projectId: string, cid: string, v: { state: StoryState; count: number }) {
  localStorage.setItem(getPersistKey(projectId, cid), JSON.stringify(v));
}

// Helper function to trim URL to just domain
function trimToDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    // Remove protocol and www, return just domain
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return cleanUrl.split('/')[0]; // Remove any path after domain
  } catch {
    return null;
  }
}

export default function CandidateProfilePage() {
  const { id: projectId, cid } = useParams();
  const navigate = useNavigate();

  const [all, setAll] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const initialPersist = useMemo(
    () => (projectId && cid ? readPersistedStory(projectId, cid) : { state: "idle", count: 0 }),
    [projectId, cid]
  );
  const [storyState, setStoryState] = useState<StoryState>(initialPersist.state as StoryState);
  const [storyCount, setStoryCount] = useState<number>(Math.min(1, initialPersist.count || 0));
  const [stageIndex, setStageIndex] = useState<number>(-1);
  const runTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (!projectId) return;
        const rows = await listCandidatesApi(projectId);
        if (!alive) return;
        setAll(rows);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !cid) return;
    writePersistedStory(projectId, cid, { state: storyState, count: Math.min(1, storyCount) });
  }, [projectId, cid, storyState, storyCount]);

  const c = useMemo(() => all.find((x) => x.id === cid), [all, cid]);

  function startStoryFlow(regenerate = false) {
    if (!projectId || !cid) return;
    setStoryState("running");
    setStageIndex(-1);
    if (regenerate) setStoryCount(0);

    const step = () => {
      setStageIndex((idx) => {
        const next = idx + 1;
        if (next >= STAGES.length) {
          window.setTimeout(() => {
            setStoryState("done");
            setStoryCount(1);
          }, 600);
          return idx;
        }
        runTimerRef.current = window.setTimeout(step, 1400 + Math.random() * 900) as unknown as number;
        return next;
      });
    };
    runTimerRef.current = window.setTimeout(step, 900) as unknown as number;
  }

  function cancelTimers() {
    if (runTimerRef.current) {
      window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
  }
  useEffect(() => () => cancelTimers(), []);

  const goToEditor = () => navigate(`/storyfinder/${projectId}/candidate/${cid}/story`);
  const websiteUrl = c?.llm_website || c?.google_api_website || null;
  const progressPct =
    storyState === "running"
      ? Math.min(100, Math.round(((stageIndex + 1) / STAGES.length) * 100))
      : storyState === "done"
      ? 100
      : 0;

  return (
    <div className="px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <button
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          onClick={() => navigate(`/storyfinder/${projectId}`)}
        >
          <ArrowLeft className="w-4 h-4" /> Back to project
        </button>
      </div>
      
      <section className="mb-6">
        <div className="rounded-2xl border-2 border-teal-600 bg-gradient-to-r from-teal-500 via-teal-600 to-sky-500">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-800 flex items-center gap-2"><Sparkles className="w-6 h-6 text-teal-800" /><h3> Story Generator</h3></div>
                {storyState === "done" ? (
                  <div className="text-sm text-slate-600 mt-1">1 story ready to view.</div>
                ) : storyState === "running" ? (
                  <div className="text-sm text-slate-600 mt-1">
                    Generating… {Math.max(0, stageIndex + 1)}/{STAGES.length}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 mt-1 ms-6">No story yet. Generate a share-ready narrative from this vendor profile!</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {storyState === "running" && (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Working…
                  </div>
                )}
                {storyState === "done" ? (
                  <>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white px-4 py-2 font-medium  hover:bg-slate-50"
                      onClick={goToEditor}  
                    >
                      View generated story <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl ring-1 ring-teal-600/30 text-teal-700 px-3 py-2"
                      onClick={() => startStoryFlow(true)}
                      title="Regenerate story"
                    >
                      <RotateCcw className="w-4 h-4" /> Regenerate
                    </button>
                  </>
                ) : storyState === "running" ? (
                  <button className="inline-flex items-center gap-2 rounded-xl bg-slate-100 text-slate-600 px-4 py-2" disabled>
                    <Wand2 className="w-4 h-4" /> Generating…
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-500 text-white px-4 py-2"
                    onClick={() => startStoryFlow(false)}
                  >
                    <Wand2 className="w-4 h-4" /> Generate story
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-4">
              <div className="h-1 w-full rounded bg-slate-100 overflow-hidden">
                <div className="h-1 bg-teal-600 transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>

              {storyState === "running" && (
                <ol className="mt-3 grid sm:grid-cols-5 gap-2">
                  {STAGES.map((label, i) => {
                    const done = i <= stageIndex;
                    const active = i === stageIndex + 1 || (stageIndex === -1 && i === 0);
                    return (
                      <li key={label} className="rounded-lg px-3 py-2 text-xs sm:text-sm flex items-center gap-2 ring-1 ring-slate-200 bg-white">
                        {done ? <Check className="w-4 h-4 text-emerald-600" /> : active ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-200" />}
                        <span className="text-slate-700">{label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="p-6 rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
          <div className="h-4 w-1/3 bg-gray-100 rounded" />
        </div>
      ) : !c ? (
        <div className="p-6 rounded-2xl bg-white ring-1 ring-slate-200 text-sm text-gray-500">Candidate not found.</div>
      ) : (
        <section className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-[96px] h-[96px] rounded-xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
              {c.logo_url ? (
                <img src={c.logo_url} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs text-slate-400">Logo</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-semibold text-slate-900">{c.vendor_name}</div>
              <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                {[c.city, c.province].filter(Boolean).join(", ") || "—"}
              </div>

              <div className="mt-4 text-sm text-slate-800">{c.extended?.summary || "—"}</div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-500">Website</div>
                    <div className="truncate">
                      {websiteUrl ? (
                        <a className="text-teal-700 break-all" href={websiteUrl} target="_blank" rel="noreferrer">
                          {trimToDomain(websiteUrl)}
                        </a>
                      ) : ("—")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-500">Candidate Score</div>
                    <div className="text-slate-800">{c.candidate_score ?? "—"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-500">Top Clients (public)</div>
                    <ul className="list-disc pl-4">
                      {(c.extended?.top_clients || []).slice(0, 5).map((x, i) => <li key={i}>{x}</li>)}
                      {(!c.extended?.top_clients || c.extended.top_clients.length === 0) && <li className="list-none text-gray-500">—</li>}
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:col-span-2">
                  <Award className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-500">Awards / Recognitions</div>
                    <ul className="list-disc pl-4">
                      {(c.extended?.awards || []).slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}
                      {(!c.extended?.awards || c.extended.awards.length === 0) && <li className="list-none text-gray-500">—</li>}
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-500">Why this candidate</div>
                    <div className="text-slate-800">{c.description || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
