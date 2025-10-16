// frontend/src/applications/LDAI/services/ldaiClient.ts
import { API_ORIGIN } from "../../../api/axios";
// import { useChatStore } from "../compnents/Chat/useChatStore";

const DEBUG =
  import.meta.env.VITE_LDAI_DEBUG === "1" ||
  localStorage.getItem("LDAI_DEBUG") === "1";
const dlog = (...a: any[]) => { if (DEBUG) console.debug("[LDAI]", ...a); };

type StartEvt = { sessionId: string; refId: string };

export function streamLdaiMessage({
  message,
  sessionId,
  modelId,
  onStart,
  onDelta,
  onDone,
  onError,
  onActions,
}: {
  message: string;
  sessionId?: string;
  modelId?: string;
  onStart: (e: StartEvt) => void;
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  onActions?: (refId: string, actions: any[]) => void;
}) {
  const qs = new URLSearchParams();
  qs.set("message", message);
  if (sessionId) qs.set("sessionId", sessionId);
  if (modelId && modelId !== "default") qs.set("modelId", modelId);

  const url = `${API_ORIGIN}/api/v1/ldai/stream?${qs.toString()}`;
  dlog("SSE →", { url, message, sessionId, modelId });

  const es = new EventSource(url);
  let bytes = 0;

  es.addEventListener("start", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      dlog("SSE ← start", data);
      onStart(data);
    } catch (err) {
      dlog("SSE ← start parse error", err);
    }
  });

  es.onmessage = (e: MessageEvent) => {
    bytes += e.data?.length || 0;
    try {
      const j = JSON.parse(e.data);
      if (j.delta) {
        dlog("SSE ← delta", j.delta);
        onDelta(j.delta);
      } else {
        dlog("SSE ← msg", j);
      }
    } catch {
      dlog("SSE ← raw", e.data);
    }
  };

  es.addEventListener("actions", (e: MessageEvent) => {
    if (!onActions) return;
    try {
      const j = JSON.parse(e.data);
      dlog("SSE ← actions", j);
      // downstream will split visuals vs suggestions
      onActions(j.refId, j.actions || []);
    } catch (err) {
      dlog("SSE ← actions parse error", err);
    }
  });

  es.addEventListener("error", () => {
    dlog("SSE ← error");
    onError("Stream connection error");
    es.close();
  });

  es.addEventListener("done", () => {
    dlog("SSE ← done", { bytes });
    onDone();
    es.close();
  });

  return () => { dlog("SSE ✖ cancel"); es.close(); };
}

export async function sendLdaiMessage(
  message: string,
  sessionId?: string,
  modelId?: string
) {
  const body: any = { message };
  if (sessionId) body.sessionId = sessionId;
  if (modelId && modelId !== "default") body.modelId = modelId;

  const url = `${API_ORIGIN}/api/v1/ldai/chat`;
  dlog("HTTP POST →", url, body);

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await r.json().catch(() => ({}));
  dlog("HTTP ←", r.status, json);
  if (!r.ok) throw new Error(JSON.stringify(json));
  return json;
}
