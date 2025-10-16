import { promises as fs } from "fs";
import path from "path";
import { chatCompletion, chatStream } from "../../../llm/provider";
import { listAllToolDefs, callTool } from "./mcp.service";

const dataDir = path.join(__dirname, "data");
const knowledgeDir = path.join(dataDir, "knowledge");
const file = (n: string) => path.join(dataDir, n);
const knowledgeFile = (n: string) => path.join(knowledgeDir, n);

// Load project knowledge from markdown file
let projectKnowledgeCache: string | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadProjectKnowledge(): Promise<string> {
  const now = Date.now();
  
  // Return cached version if still valid
  if (projectKnowledgeCache && (now - lastCacheTime) < CACHE_DURATION) {
    return projectKnowledgeCache;
  }
  
  try {
    const knowledgePath = knowledgeFile("project_knowledge.md");
    const knowledge = await fs.readFile(knowledgePath, "utf-8");
    const trimmed = knowledge.trim();
    
    // Update cache
    projectKnowledgeCache = trimmed;
    lastCacheTime = now;
    
    return trimmed;
  } catch (error) {
    console.warn("[KNOWLEDGE] Failed to load project knowledge:", error);
    // Return cached version if available, even if expired
    return projectKnowledgeCache || "";
  }
}

// Function to manually refresh the knowledge cache
export async function refreshProjectKnowledge(): Promise<void> {
  projectKnowledgeCache = null;
  lastCacheTime = 0;
  await loadProjectKnowledge(); // This will reload and cache
}

type Provider = "openai" | "anthropic" | "google" | "xai";

const SEEDS: Record<string, any> = {
  "chat_sessions.json": { sessions: {} },
  "tool_cache.json": { servers: [] },
  "resources_index.json": { resources: [] },
  "runs.json": { runs: [] },
  "llm_models_config.json": {
    defaultModel: { provider: "openai", model: "gpt-4o-mini" },
    systemPrompt: "You are LDAI assistant. Be concise, professional, and factual."
  }
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await Promise.all(
    Object.entries(SEEDS).map(async ([k, v]) => {
      const p = file(k);
      try {
        const txt = await fs.readFile(p, "utf-8").catch(() => "");
        if (!txt || !txt.trim()) await fs.writeFile(p, JSON.stringify(v, null, 2));
      } catch {
        await fs.writeFile(p, JSON.stringify(v, null, 2));
      }
    })
  );
}

async function readJSON<T>(name: string): Promise<T> {
  const p = file(name);
  try {
    const txt = await fs.readFile(p, "utf-8");
    if (!txt || !txt.trim()) throw new Error("empty");
    return JSON.parse(txt) as T;
  } catch {
    const seed = (SEEDS[name] ?? {}) as T;
    await fs.writeFile(p, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function writeJSON(name: string, obj: any) {
  const p = file(name);
  const tmp = p + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2));
  await fs.rename(tmp, p);
}

const makeSessionId = () =>
  (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();

function nextRefForSession(s: any, sid: string) {
  const current = s.sessions[sid]?.nextRef ?? 1;
  const refId = Math.max(1, Math.min(50, current));
  s.sessions[sid] = { ...(s.sessions[sid] || {}), nextRef: refId + 1 };
  return String(refId);
}

export async function getConfig() {
  await ensureStore();
  return readJSON<{ defaultModel:{provider:Provider;model:string}; systemPrompt:string }>("llm_models_config.json");
}

export async function listTools()     { await ensureStore(); return readJSON("tool_cache.json"); }
export async function listResources() { await ensureStore(); return readJSON("resources_index.json"); }

// ---------- helpers for tool exposure ----------
function toOpenAITools(flat: Array<{server:string; name:string; description?:string; inputSchema?:any}>) {
  return flat.map(t => ({
    type: "function",
    function: {
      name: `${t.server}__${t.name}`.slice(0,64),
      description: t.description || `MCP tool ${t.server}/${t.name}`,
      parameters: t.inputSchema && Object.keys(t.inputSchema).length
        ? t.inputSchema
        : { type:"object", properties:{}, additionalProperties:true }
    }
  }));
}

async function loadOpenAITools() {
  const defs = await listAllToolDefs();
  const flat = defs.flatMap((s:any) => (s.tools || []).map((t:any) => ({
    server: s.server, name: t.name, description: t.description, inputSchema: t.inputSchema
  })));
  await writeJSON("tool_cache.json", { servers: defs });
  return toOpenAITools(flat);
}

// ---------- simple once ----------
export async function chatOnce({ message, sessionId, modelId }: {
  message: string; sessionId?: string; modelId?: string;
}) {
  await ensureStore();
  const cfg = await getConfig();
  const sessions = await readJSON<{ sessions: Record<string, any> }>("chat_sessions.json");

  const sid = sessionId || makeSessionId();
  const refId = nextRefForSession(sessions, sid);
  await writeJSON("chat_sessions.json", sessions);

  const model = modelId
    ? { provider: cfg.defaultModel.provider, model: modelId }
    : cfg.defaultModel;

  const history = sessions.sessions[sid]?.history || [];
  
  // Load project knowledge
  const projectKnowledge = await loadProjectKnowledge();

  const finalSystem =
    `${cfg.systemPrompt}\n\n` +
    `${projectKnowledge ? `## Project Knowledge Base\n${projectKnowledge}\n\n` : ""}` +
    `Current turn reference: #${refId}\n` +
    `- If you mention visuals/actions, include "ref #${refId}" once.\n` +
    `- IMPORTANT: End your response with exactly ONE question that the suggestions will answer\n` +
    `- The question should be the very last sentence of your response\n` +
    `- Do not include multiple questions or questions in the middle of the response\n` +
    `- CRITICAL: Never repeat words or phrases. Write each piece of information only once.\n` +
    `- When listing contact details, use clean format: "Phone: 123-456-7890" not "PhonePhone: 123-456-7890"\n` +
    `- When listing email, use clean format: "Email: example@email.com" not "EmailEmail: example@email.com"`;

  // expose tools even in non-stream path:
  const openaiTools = await loadOpenAITools();

  const first = await chatCompletion({
    provider: "openai",
    model: model.model,
    system: finalSystem,
    messages: [...history, { role: "user", content: message }],
    tools: openaiTools
  } as any);

  let content = typeof first === "string" ? first : (first?.content ?? "");
  const toolCalls = (first as any)?.tool_calls || [];

  const convo: any[] = [...history, { role: "user", content: message }];

  if (Array.isArray(toolCalls) && toolCalls.length) {
    convo.push({ role:"assistant", content: content || null, tool_calls: toolCalls });
    for (const tc of toolCalls) {
      const fnName: string = tc.function?.name || tc.name || "";
      const argsRaw = tc.function?.arguments || tc.arguments || "{}";
      const [server, tool] = fnName.split("__", 2);
      let args: any = {}; try { args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw; } catch {}
      const { result } = await callTool(server, tool, args);
      convo.push({ role:"tool", tool_call_id: tc.id, name: fnName, content: typeof result === "string" ? result : JSON.stringify(result) });
    }
    const second = await chatCompletion({ provider:"openai", model: model.model, system: finalSystem, messages: convo } as any);
    content = typeof second === "string" ? second : (second?.content ?? "");
  }

  const turn = { refId, user: message, answer: content, actions: [] as any[] };
  sessions.sessions[sid] = {
    history: [...(sessions.sessions[sid]?.history || []), { role: "user", content: message }, { role: "assistant", content }],
    turns: [...(sessions.sessions[sid]?.turns || []), turn],
    nextRef: sessions.sessions[sid]?.nextRef ?? 2
  };
  await writeJSON("chat_sessions.json", sessions);

  return { answer: content, sessionId: sid, refId, actions: [] };
}

// ---------- STREAM: tool-aware ----------
export async function streamLLM({ message, sessionId, modelId }: {
  message: string; sessionId?: string; modelId?: string;
}) {
  await ensureStore();
  const cfg = await getConfig();
  const sessions = await readJSON<{ sessions: Record<string, any> }>("chat_sessions.json");

  const sid = sessionId || makeSessionId();
  const refId = nextRefForSession(sessions, sid);
  await writeJSON("chat_sessions.json", sessions);

  const model = modelId
    ? { provider: cfg.defaultModel.provider, model: modelId }
    : cfg.defaultModel;

  const hist = sessions.sessions[sid]?.history || [];
  
  // Load project knowledge
  const projectKnowledge = await loadProjectKnowledge();

  const system =
    `${cfg.systemPrompt}\n\n` +
    `${projectKnowledge ? `## Project Knowledge Base\n${projectKnowledge}\n\n` : ""}` +
    `Current turn reference: #${refId}\n` +
    `- If you mention visuals/actions, include "ref #${refId}" once.\n` +
    `- IMPORTANT: End your response with exactly ONE question that the suggestions will answer\n` +
    `- The question should be the very last sentence of your response\n` +
    `- Do not include multiple questions or questions in the middle of the response\n` +
    `- CRITICAL: Never repeat words or phrases. Write each piece of information only once.\n` +
    `- When listing contact details, use clean format: "Phone: 123-456-7890" not "PhonePhone: 123-456-7890"\n` +
    `- When listing email, use clean format: "Email: example@email.com" not "EmailEmail: example@email.com"`;

  // 1) Expose tools and do a quick non-stream turn to see if tools are needed
  const openaiTools = await loadOpenAITools();
  const first = await chatCompletion({
    provider: "openai",
    model: model.model,
    system,
    messages: [...hist, { role: "user", content: message }],
    tools: openaiTools
  } as any);

  const toolCalls = (first as any)?.tool_calls || [];
  let streamMessages: any[];

  if (Array.isArray(toolCalls) && toolCalls.length) {
    // 2) Build convo with assistant(tool_calls) and tool results
    const convo: any[] = [...hist, { role: "user", content: message }];
    const content = typeof first === "string" ? first : (first?.content ?? "");
    convo.push({ role:"assistant", content: content || null, tool_calls: toolCalls });

    for (const tc of toolCalls) {
      const fnName: string = tc.function?.name || tc.name || "";
      const argsRaw = tc.function?.arguments || tc.arguments || "{}";
      const [server, tool] = fnName.split("__", 2);
      let args: any = {}; try { args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw; } catch {}
      const { result } = await callTool(server, tool, args);
      convo.push({
        role: "tool",
        tool_call_id: tc.id,
        name: fnName,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }

    // 3) Stream the *second* assistant grounded on tool outputs
    streamMessages = convo;
  } else {
    // No tool calls; stream the normal assistant
    streamMessages = [...hist, { role: "user", content: message }];
  }

  return {
    sid,
    refId,
    provider: model.provider,
    model: model.model,
    system,
    history: {
      stream: ({ provider, model, system }: { provider: string; model: string; system: string; }) =>
        chatStream({
          provider: provider as Provider,
          model,
          system,
          messages: streamMessages as any
        })
    }
  };
}

export async function saveTurnAfterStream({
  sid, refId, user, answer, actions = [],
}: {
  sid: string; refId: string; user: string; answer: string; actions?: any[];
}) {
  await ensureStore();
  const sessions = await readJSON<{ sessions: Record<string, any> }>("chat_sessions.json");
  const prev = sessions.sessions[sid]?.history || [];
  const turn = { refId, user, answer, actions };
  sessions.sessions[sid] = {
    history: [...prev, { role: "user", content: user }, { role: "assistant", content: answer }],
    turns: [...(sessions.sessions[sid]?.turns || []), turn],
    nextRef: sessions.sessions[sid]?.nextRef ?? 2
  };
  await writeJSON("chat_sessions.json", sessions);
}

export async function appendActions({ sid, refId, actions }: { sid: string; refId: string; actions: any[] }) {
  await ensureStore();
  const sessions = await readJSON<{ sessions: Record<string, any> }>("chat_sessions.json");
  const session = sessions.sessions[sid] || { history: [], turns: [], nextRef: 1 };
  const turns = session.turns || [];
  const idx = turns.findIndex((t: any) => t.refId === refId);
  if (idx >= 0) { const t = turns[idx]; t.actions = [...(t.actions || []), ...actions]; turns[idx] = t; }
  else { turns.push({ refId, user: "", answer: "", actions }); }
  sessions.sessions[sid] = { ...session, turns };
  await writeJSON("chat_sessions.json", sessions);
}
