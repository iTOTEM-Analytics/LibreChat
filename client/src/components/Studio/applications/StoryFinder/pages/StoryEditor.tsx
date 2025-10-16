// frontend/src/pages/storyfinder/GeneratedStoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Pencil, Trash2, Save, X, Download, Image as ImgIcon, Heading, Type } from "lucide-react";
import api from "../../../api/axios";

type StoryBlock = { type: "h2"; text: string } | { type: "p"; text: string } | { type: "image"; url: string; alt?: string };
type StoryDoc = {
  projectId?: string;
  candidateId: string;
  vendor?: string;
  title: string;
  h1: string;
  intro: string;
  heroImage?: { url?: string; alt?: string };
  sections: StoryBlock[];
  summary: string;
  tags?: string[];
};

function key(projectId: string, cid: string) {
  return `sf:storydoc:${projectId}:${cid}`;
}
function estimateReadMins(doc: StoryDoc) {
  const texts: string[] = [doc.h1, doc.intro, doc.summary, ...doc.sections.filter(s => s.type !== "image").map((s: any) => s.text || "")];
  const words = texts.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function StoryEditor() {
  const { id: projectId, cid } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<StoryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editH1, setEditH1] = useState(false);
  const [editIntro, setEditIntro] = useState(false);
  const [editSummary, setEditSummary] = useState(false);
  const [editHero, setEditHero] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (!projectId || !cid) return;
        let json: StoryDoc | null = null;

        try {
          const response = await api.get(`/storyfinder/projects/${encodeURIComponent(projectId)}/candidate/${encodeURIComponent(cid)}/story`);
          json = response.data as StoryDoc;
          console.log("✅ Story loaded in editor:", json);
        } catch (error) {
          console.error("❌ Error loading story in editor:", error);
        }

        if (!json) {
          const raw = localStorage.getItem(key(projectId, cid));
          if (raw) json = JSON.parse(raw) as StoryDoc;
        }

        if (!json) {
          json = {
            projectId,
            candidateId: cid,
            title: "Draft Story",
            h1: "Untitled Headline",
            intro: "Use the pencil icons to edit sections.",
            heroImage: { url: "", alt: "" },
            sections: [{ type: "image", url: "", alt: "" }, { type: "h2", text: "Section Title" }, { type: "p", text: "Write your paragraph here…" }],
            summary: "Key takeaway.",
            tags: []
          };
        }

        if (!alive) return;
        setDoc(json);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [projectId, cid]);

  const mins = useMemo(() => (doc ? estimateReadMins(doc) : 1), [doc]);

  function persist(next: StoryDoc) {
    if (!projectId || !cid) return;
    localStorage.setItem(key(projectId, cid), JSON.stringify(next));
    api.post(`/storyfinder/projects/${encodeURIComponent(projectId)}/candidate/${encodeURIComponent(cid)}/story`, next).catch((error) => {
      console.error("❌ Error saving story:", error);
    });
  }

  if (!projectId || !cid) {
    return <div className="px-4 sm:px-6"><div className="p-6 rounded-2xl bg-white ring-1 ring-slate-200 text-sm text-gray-600">Missing project or candidate id.</div></div>;
  }

  if (loading || !doc) {
    return (
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800" onClick={() => navigate(`/storyfinder/${projectId}/candidate/${cid}`)}>
            <ArrowLeft className="w-4 h-4" /> Back to candidate
          </button>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-3">
          <div className="h-7 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-64 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const setAndSave = (updater: (d: StoryDoc) => StoryDoc) => { const next = updater(doc!); setDoc(next); persist(next); };

  return (
    <div className="px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800" onClick={() => navigate(`/storyfinder/${projectId}/candidate/${cid}`)}>
          <ArrowLeft className="w-4 h-4" /> Back to candidate
        </button>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => downloadJSON(`${doc!.title || "story"}.json`, doc)}>
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => persist(doc!)}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-3 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {mins} min read
            </div>

            {!editH1 ? (
              <h1 className="mt-1 text-3xl md:text-4xl font-bold text-teal-800 break-words">{doc!.h1 || "Untitled Headline"}</h1>
            ) : (
              <input autoFocus className="mt-2 w-full rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-2xl font-semibold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600" value={doc!.h1} onChange={(e) => setDoc({ ...doc!, h1: e.target.value })} />
            )}
          </div>

          <div className="flex-shrink-0">
            {!editH1 ? (
              <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditH1(true)}>
                <Pencil className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => { setEditH1(false); persist(doc!); }}>
                  <Save className="w-4 h-4" />
                </button>
                <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditH1(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-slate-600">
          {!editIntro ? (
            <p className="text-sm md:text-base">{doc!.intro}</p>
          ) : (
            <textarea autoFocus className="w-full min-h-28 rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" value={doc!.intro} onChange={(e) => setDoc({ ...doc!, intro: e.target.value })} />
          )}
          <div className="mt-2">
            {!editIntro ? (
              <button className="text-xs rounded-lg px-2 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1" onClick={() => setEditIntro(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit intro
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="text-xs rounded-lg px-2 py-1 bg-teal-700 text-white hover:bg-teal-600 inline-flex items-center gap-1" onClick={() => { setEditIntro(false); persist(doc!); }}>
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button className="text-xs rounded-lg px-2 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1" onClick={() => setEditIntro(false)}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {(!doc!.heroImage?.url || editHero) ? (
            <div className="rounded-xl ring-1 ring-slate-200 p-4 bg-slate-50">
              <div className="grid sm:grid-cols-3 gap-3">
                <input className="sm:col-span-2 rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" placeholder="Image URL" value={doc!.heroImage?.url || ""} onChange={(e) => setDoc({ ...doc!, heroImage: { ...(doc!.heroImage || {}), url: e.target.value } })} />
                <input className="rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" placeholder="Alt text" value={doc!.heroImage?.alt || ""} onChange={(e) => setDoc({ ...doc!, heroImage: { ...(doc!.heroImage || {}), alt: e.target.value } })} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => { setEditHero(false); persist(doc!); }}>
                  <Save className="w-4 h-4" />
                </button>
                <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditHero(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <img src={doc!.heroImage!.url!} alt={doc!.heroImage!.alt || ""} className="w-full rounded-xl ring-1 ring-slate-200" />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white/90 hover:bg-white" onClick={() => setEditHero(true)}>
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-6">
        {doc!.sections.map((s, i) => {
          const editing = editIdx === i;
          if (s.type === "h2") {
            return (
              <div key={i} className="relative">
                {!editing ? (
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-2xl font-semibold text-slate-800">{s.text}</h2>
                    <div className="flex items-center gap-2">
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(i)}>
                        <Heading className="w-4 h-4" />
                      </button>
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setAndSave(d => ({ ...d, sections: d.sections.filter((_, j) => j !== i) }))}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl ring-1 ring-slate-200 p-3 bg-slate-50">
                    <input autoFocus className="w-full rounded-lg border-0 ring-1 ring-slate-300 px-3 py-2 text-base focus:ring-2 focus:ring-teal-600" value={s.text} onChange={(e) => setDoc({ ...doc!, sections: doc!.sections.map((b, j) => (j === i ? { ...b, text: e.target.value } as StoryBlock : b)) })} />
                    <div className="mt-2 flex items-center gap-2">
                      <button className="rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => { setEditIdx(null); persist(doc!); }}>
                        <Save className="w-4 h-4" />
                      </button>
                      <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          if (s.type === "p") {
            return (
              <div key={i} className="relative">
                {!editing ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-700 leading-relaxed">{s.text}</p>
                    <div className="flex items-center gap-2">
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(i)}>
                        <Type className="w-4 h-4" />
                      </button>
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setAndSave(d => ({ ...d, sections: d.sections.filter((_, j) => j !== i) }))}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl ring-1 ring-slate-200 p-3 bg-slate-50">
                    <textarea autoFocus className="w-full min-h-28 rounded-lg border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" value={s.text} onChange={(e) => setDoc({ ...doc!, sections: doc!.sections.map((b, j) => (j === i ? { ...b, text: e.target.value } as StoryBlock : b)) })} />
                    <div className="mt-2 flex items-center gap-2">
                      <button className="rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => { setEditIdx(null); persist(doc!); }}>
                        <Save className="w-4 h-4" />
                      </button>
                      <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={i} className="relative">
              <div className="rounded-xl ring-1 ring-slate-200 p-3 bg-slate-50">
                {s.url ? (
                  <div className="flex items-start justify-between gap-2">
                    <img src={s.url} alt={("alt" in s && s.alt) || ""} className="rounded-lg ring-1 ring-slate-200 max-h-[360px] w-auto" />
                    <div className="flex items-center gap-2">
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(i)}>
                        <ImgIcon className="w-4 h-4" />
                      </button>
                      <button className="rounded-xl px-2.5 py-1.5 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setAndSave(d => ({ ...d, sections: d.sections.filter((_, j) => j !== i) }))}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <ImgIcon className="w-4 h-4" /> No image. Click edit to add a URL.
                    <button className="ml-auto text-xs rounded-lg px-2 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(i)}>
                      Edit
                    </button>
                  </div>
                )}
                {("alt" in s && s.alt) ? <div className="mt-2 text-xs text-slate-500">{s.alt}</div> : null}
              </div>
              {editIdx === i && (
                <div className="mt-2 rounded-xl ring-1 ring-slate-200 p-3 bg-slate-50">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input autoFocus className="sm:col-span-2 rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" placeholder="Image URL" value={s.url} onChange={(e) => setDoc({ ...doc!, sections: doc!.sections.map((b, j) => (j === i ? { ...(b as any), url: e.target.value } : b)) })} />
                    <input className="rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" placeholder="Alt text" value={("alt" in s && s.alt) || ""} onChange={(e) => setDoc({ ...doc!, sections: doc!.sections.map((b, j) => (j === i ? { ...(b as any), alt: e.target.value } : b)) })} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded-xl px-3 py-2 bg-teal-700 text-white hover:bg-teal-600" onClick={() => { setEditIdx(null); persist(doc!); }}>
                      <Save className="w-4 h-4" />
                    </button>
                    <button className="rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white hover:bg-slate-50" onClick={() => setEditIdx(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl ring-1 ring-slate-200 p-4 bg-slate-50">
          {!editSummary ? (
            <p className="text-slate-700">{doc!.summary}</p>
          ) : (
            <textarea autoFocus className="w-full min-h-28 rounded-xl border-0 ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600" value={doc!.summary} onChange={(e) => setDoc({ ...doc!, summary: e.target.value })} />
          )}
          <div className="mt-2">
            {!editSummary ? (
              <button className="text-xs rounded-lg px-2 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1" onClick={() => setEditSummary(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit summary
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="text-xs rounded-lg px-2 py-1 bg-teal-700 text-white hover:bg-teal-600 inline-flex items-center gap-1" onClick={() => { setEditSummary(false); persist(doc!); }}>
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button className="text-xs rounded-lg px-2 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1" onClick={() => setEditSummary(false)}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
