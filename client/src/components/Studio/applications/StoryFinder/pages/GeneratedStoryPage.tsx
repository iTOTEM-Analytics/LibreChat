// frontend/src/pages/storyfinder/GeneratedStoryArticlePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, Download, ChevronDown, Pencil,
  Share2,
  Mail
} from "lucide-react";
import api from "../../../api/axios";

type StoryBlock = { type: "h2"; text: string } | { type: "p"; text: string } | { type: "image"; url: string; alt?: string };
type StoryDoc = {
  projectId?: string;
  candidateId: string;
  vendor?: string;
  title?: string;
  h1: string;
  intro?: string;
  heroImage?: { url?: string; alt?: string };
  sections: StoryBlock[];
  summary?: string;
  tags?: string[];
  publishedAt?: string; // ISO
};

function key(projectId: string, cid: string) {
  return `sf:storydoc:${projectId}:${cid}`;
}
function estimateReadMins(doc: StoryDoc) {
  const texts: string[] = [doc.h1, doc.intro || "", doc.summary || "", ...doc.sections.filter(s => s.type !== "image").map((s: any) => s.text || "")];
  const words = texts.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
function toMarkdown(d: StoryDoc) {
  const lines: string[] = [];
  lines.push(`# ${d.h1}`);
  if (d.intro) lines.push("", d.intro);
  for (const s of d.sections) {
    if (s.type === "h2") lines.push("", `## ${s.text}`);
    if (s.type === "p") lines.push("", s.text);
    if (s.type === "image") lines.push("", `![${s.alt || ""}](${s.url})`);
  }
  if (d.summary) lines.push("", `**Summary**: ${d.summary}`);
  return lines.join("\n");
}
function download(filename: string, data: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function GeneratedStoryPage() {
  const { id: projectId, cid } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<StoryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!projectId || !cid) return;
        let json: StoryDoc | null = null;

        try {
          const response = await api.get(`/storyfinder/projects/${encodeURIComponent(projectId)}/candidate/${encodeURIComponent(cid)}/story`);
          json = response.data as StoryDoc;
          console.log("✅ Story loaded from API:", json);
        } catch (error) {
          console.error("❌ Error loading story from API:", error);
        }

        if (!json) {
          const raw = localStorage.getItem(key(projectId, cid));
          if (raw) json = JSON.parse(raw) as StoryDoc;
        }

        if (!json) {
          json = {
            projectId, candidateId: cid,
            h1: "Untitled Headline",
            intro: "Intro text…",
            sections: [{ type: "h2", text: "Section Title" }, { type: "p", text: "Paragraph…" }],
            summary: "Key takeaway.",
            publishedAt: new Date().toISOString(),
          };
        }
        if (!alive) return;
        setDoc(json);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, cid]);

  const mins = useMemo(() => (doc ? estimateReadMins(doc) : 1), [doc]);
  const dateStr = useMemo(() => (doc?.publishedAt ? new Date(doc.publishedAt).toLocaleDateString() : new Date().toLocaleDateString()), [doc]);

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

  return (
    <div className="px-4 sm:px-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800" onClick={() => navigate(`/storyfinder/${projectId}/candidate/${cid}`)}>
          <ArrowLeft className="w-4 h-4" /> Back to candidate
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/storyfinder/${projectId}/candidate/${cid}/story/edit`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" /> Editor
          </Link>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => setExportOpen((v) => !v)}
          >
            Export Options <ChevronDown className="w-4 h-4" />
          </button>
          {exportOpen && (
            <div className="absolute mt-36 right-6 z-10 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => download(`${doc.title || doc.h1 || "story"}.pdf`, toMarkdown(doc), "application/pdf")}
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                    const url = window.location.href;
                    window.location.href = `mailto:?subject=Story%20Finder%20Story&body=Check%20out%20this%20story%20from%20Story%20Finder:${url}`;
                  }}
              >
                <Mail className="w-4 h-4" /> Notify by email
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  const url = window.location.href;
                  window.location.href = `share:?subject=Story%20Finder%20Story&body=Check%20out%20this%20story%20from%20Story%20Finder:${url}`;
                }}
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-4xl">
        {/* Decorative line */}
        <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-blue-500 mx-auto mb-12 rounded-full"></div>
        <header className="mb-12 text-center">
          <div className="text-sm text-slate-500 flex items-center justify-center gap-4 mb-4">
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4" /> 
              {mins} min read
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6">
            {doc.h1}
          </h1>
          {doc.intro && (
            <p className="text-xl md:text-2xl leading-relaxed text-slate-600 max-w-4xl mx-auto font-light">
              {doc.intro}
            </p>
          )}
        </header>

        {doc.heroImage?.url && (
          <div className="mb-12">
            <div className="relative">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img 
                src={doc.heroImage.url} 
                alt={doc.heroImage.alt || ""} 
                className="w-full rounded-3xl shadow-lg ring-1 ring-slate-200" 
              />
              {doc.heroImage.alt && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-sm px-4 py-2 rounded-xl backdrop-blur-sm">
                  {doc.heroImage.alt}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-10">
          {doc.sections.map((s, i) => {
            if (s.type === "h2") {
              return (
                <div key={i} className="pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                      {s.text}
                    </h2>
                  </div>
                </div>
              );
            }
            if (s.type === "p") {
              return (
                <p key={i} className="text-lg leading-8 text-slate-700 font-normal max-w-3xl">
                  {s.text}
                </p>
              );
            }
            return (
              <figure key={i} className="my-10">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img 
                  src={s.url} 
                  alt={("alt" in s && s.alt) || ""} 
                  className="w-full rounded-2xl ring-1 ring-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300" 
                />
                {("alt" in s && s.alt) ? (
                  <figcaption className="text-sm text-slate-500 mt-4 text-center italic">
                    {s.alt}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
          
          {doc.summary && (
            <div className="pt-12 border-t border-slate-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-teal-700 leading-tight tracking-tight mb-3">
                  Key Takeaways
                </h2>
                <div className="w-16 h-1 bg-teal-500 mx-auto rounded-full"></div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 p-8 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-xl leading-8 text-slate-800 font-medium">
                    {doc.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
