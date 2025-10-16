// backend/api/v1/storyfinder/processing/llmWorker.ts
import { Candidate } from "../types";

export type EnrichOpts = {
  projectId: string;
  focus: "innovation" | "sustainability" | "growth";
};

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const PROVIDER = (process.env.LLM_PROVIDER || "").toLowerCase(); // "openai" | "groq" | "gemini"

async function postJSON(url: string, body: any, headers: Record<string, string>) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function callOpenAI(prompt: string) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  };
  const j = await postJSON(url, body, { Authorization: `Bearer ${OPENAI_KEY}` });
  const text = j?.choices?.[0]?.message?.content || "";
  return text;
}

async function callGroq(prompt: string) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const body = {
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  };
  const j = await postJSON(url, body, { Authorization: `Bearer ${GROQ_KEY}` });
  const text = j?.choices?.[0]?.message?.content || "";
  return text;
}

async function callGemini(prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-1.5-flash"}:generateContent?key=${GEMINI_KEY}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const j = await postJSON(url, body, {});
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

function chooseProvider() {
  if (PROVIDER === "openai" && OPENAI_KEY) return "openai";
  if (PROVIDER === "groq" && GROQ_KEY) return "groq";
  if (PROVIDER === "gemini" && GEMINI_KEY) return "gemini";
  if (OPENAI_KEY) return "openai";
  if (GROQ_KEY) return "groq";
  if (GEMINI_KEY) return "gemini";
  return "stub";
}

function buildPrompt(c: Candidate, focus: string) {
  const lines = [
    `You are enriching a vendor profile for narrative discovery.`,
    `Vendor: ${c.vendor_name}`,
    `City: ${c.city ?? ""}`,
    `Province/State: ${c.province ?? ""}`,
    `Known website: ${c.google_api_website ?? ""}`,
    `Focus: ${focus}`,
    ``,
    `Return a compact JSON with keys:`,
    `summary (<=280 chars),`,
    `llm_website,`,
    `top_clients (array, <=3 strings),`,
    `awards (array, <=3 strings),`,
    `score_adjust (-10..+10 integer),`,
    `description (1 short sentence).`,
    ``,
    `Only JSON, no extra text.`,
  ];
  return lines.join("\n");
}

function safeParse(jsonStr: string): any | null {
  try {
    const m = jsonStr.match(/\{[\s\S]*\}$/);
    const t = m ? m[0] : jsonStr;
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export async function enrichBatch(batch: Candidate[], opts: EnrichOpts): Promise<Candidate[]> {
  const provider = chooseProvider();
  if (provider === "stub") {
    // fallback
    return batch.map((c) => ({
      ...c,
      candidate_score: Math.min(100, Math.max(0, (c.candidate_score ?? 70) + 3)),
      llm_website: c.google_api_website || c.llm_website || null,
      description: c.description && c.description !== "Potential narrative opportunity"
        ? c.description
        : `Notable ${opts.focus} signals at ${c.vendor_name}.`,
      extended: {
        summary: `${c.vendor_name} shows momentum on ${opts.focus}.`,
        top_clients: [],
        awards: [],
      },
    }));
  }

  // lightweight concurrency
  const out: Candidate[] = [];
  for (const c of batch) {
    const prompt = buildPrompt(c, opts.focus);
    let text = "";
    try {
      if (provider === "openai") text = await callOpenAI(prompt);
      else if (provider === "groq") text = await callGroq(prompt);
      else if (provider === "gemini") text = await callGemini(prompt);
    } catch {
      // fallback to stub for this item
      out.push({
        ...c,
        candidate_score: Math.min(100, Math.max(0, (c.candidate_score ?? 70) + 3)),
        llm_website: c.google_api_website || c.llm_website || null,
        description: c.description || `Notable ${opts.focus} signals at ${c.vendor_name}.`,
        extended: { summary: `${c.vendor_name} shows momentum on ${opts.focus}.`, top_clients: [], awards: [] },
      });
      continue;
    }

    const j = safeParse(text) || {};
    const adj = Number.isFinite(j.score_adjust) ? Number(j.score_adjust) : 0;
    const newScore = Math.max(0, Math.min(100, (c.candidate_score ?? 70) + adj));
    out.push({
      ...c,
      candidate_score: newScore,
      llm_website: j.llm_website || c.google_api_website || c.llm_website || null,
      description: j.description || c.description || `Notable ${opts.focus} signals at ${c.vendor_name}.`,
      extended: {
        summary: j.summary || undefined,
        top_clients: Array.isArray(j.top_clients) ? j.top_clients.slice(0, 3) : undefined,
        awards: Array.isArray(j.awards) ? j.awards.slice(0, 3) : undefined,
      },
    });
  }
  return out;
}
