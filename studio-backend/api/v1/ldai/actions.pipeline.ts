// backend/api/v1/ldai/actions.pipeline.ts
import { z } from "zod";
import { chatCompletion } from "../../../llm/provider";
import { plannerMessages } from "./promptcomposer";
import { ActionSchema, Action, VisualActionT } from "./schemas/action.schema";
import { callTool } from "./mcp.service";

const PlanSchema = z.object({
  tool_calls: z.array(z.object({
    server: z.string(),
    method: z.string(),
    params: z.any().optional(),
  })).default([]),
  actions: z.array(z.any()).default([]),
});

function safeExtractJson(s: string) {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) return s.slice(start, end + 1);
  return "{}";
}

const TYPE_ALIASES: Record<string,
  "plotly_bar"|"plotly_pie"|"table"|"map_osm"|"form_contact"|"download"|"contact_card"|"insight_card"|"website_card"
> = {
  bar: "plotly_bar",
  barchart: "plotly_bar",
  bar_chart: "plotly_bar",
  pie: "plotly_pie",
  piechart: "plotly_pie",
  pie_chart: "plotly_pie",
  table: "table",
  map: "map_osm",
  map_osm: "map_osm",
  form: "form_contact",
  form_contact: "form_contact",
  download: "download",
  contact: "contact_card",
  contactcard: "contact_card",
  contact_card: "contact_card",
  insight: "insight_card",
  insightcard: "insight_card",
  insight_card: "insight_card",
  website: "website_card",
  websitecard: "website_card",
  website_card: "website_card",
};

const isFiniteNum = (v: any) => Number.isFinite(v);

function coerceVisualAction(a: any, refId: string): VisualActionT | null {
  const rawType = String(a?.type ?? "").toLowerCase();
  const mapped = TYPE_ALIASES[rawType] ?? a?.type;
  const kind = a?.kind ?? (mapped ? "visual" : undefined);
  const coerced: any = {
    v: 1,
    refId,
    kind,
    type: mapped,
    title: a?.title,
    payload: a?.payload ?? a?.data ?? a?.content ?? {},
    meta: a?.meta,
  };

  if (coerced.kind === "visual" && coerced.type === "table") {
    const p = coerced.payload;
    if (Array.isArray(p) && p.length && typeof p[0] === "object" && !Array.isArray(p[0])) {
      const cols = Array.from(new Set(p.flatMap((r: any) => Object.keys(r))));
      const rows = p.map((r: any) => cols.map((c) => r[c]));
      coerced.payload = { columns: cols, rows };
    } else if (!p?.columns || !p?.rows) {
      coerced.payload = { columns: [], rows: [] };
    }
    if (!Array.isArray(coerced.payload.rows) || coerced.payload.rows.length === 0) return null;
  }

  if (coerced.kind === "visual" && coerced.type === "plotly_bar") {
    const p = coerced.payload || {};
    const x = Array.isArray(p.x) ? p.x : [];
    const ySrc = Array.isArray(p.y) ? p.y : [];
    const y = ySrc.map((v: any) =>
      typeof v === "string" ? Number(v.replace(/[, ]/g, "")) : v
    ).map((v: any) => (Number.isFinite(v) ? Number(v) : NaN));
    if (!y.length || !y.some(isFiniteNum)) return null;
    coerced.payload = { x, y, title: p.title };
  }

  if (coerced.kind === "visual" && coerced.type === "plotly_pie") {
    const p = coerced.payload || {};
    const labels = Array.isArray(p.labels) ? p.labels : [];
    const values = (Array.isArray(p.values) ? p.values : []).map((v: any) => +v).filter(isFiniteNum);
    if (!values.length) return null;
    coerced.payload = { labels, values, title: p.title };
  }

  const ok = ActionSchema.safeParse(coerced);
  return ok.success ? ok.data as VisualActionT : null;
}

function summarizeToolResult(r: any): { value: any; units?: string } {
  if (r == null) return { value: "n/a" };
  if (typeof r === "number" || typeof r === "string" || typeof r === "boolean") return { value: r };
  if (typeof r === "object") {
    if ("value" in r && (typeof (r as any).value === "number" || typeof (r as any).value === "string")) {
      return { value: (r as any).value, units: (r as any).units };
    }
    const keys = Object.keys(r);
    const key = keys.find((k) => /amount|count|value|total|hectare|area|turtle|fish|percent|year/i.test(k)) || keys[0];
    return { value: (r as any)[key] };
  }
  return { value: String(r) };
}

function buildBarFromToolResults(
  refId: string,
  toolResults: Array<{ server:string; method:string; params?:any; result:any }>
): VisualActionT | null {
  if (toolResults.length < 2) return null;
  const unique = new Set(toolResults.map(t => `${t.server}.${t.method}`));
  if (unique.size !== 1) return null;

  const x: (string|number)[] = [];
  const y: number[] = [];
  for (const tr of toolResults) {
    const m = summarizeToolResult(tr.result);
    const label = tr.params?.year ?? tr.params?.years ?? tr.params?.label ?? x.length + 1;
    x.push(typeof label === "number" ? label : String(label));
    const num = Number(m.value);
    y.push(Number.isFinite(num) ? num : NaN);
  }
  const cleanY = y.filter(isFiniteNum);
  if (!cleanY.length) return null;

  const a: VisualActionT = {
    v: 1,
    refId,
    kind: "visual",
    type: "plotly_bar",
    title: "Tool results",
    payload: { x, y: cleanY, title: undefined },
    meta: { tool: Array.from(unique).values().next().value }
  };
  const ok = ActionSchema.safeParse(a);
  return ok.success ? a : null;
}

export async function inferAndExecuteActions(opts: {
  user: string;
  assistant: string;
  refId: string;
  model: { provider: "openai" | "anthropic" | "google" | "xai"; name: string };
  sessionSummary?: string;
}) {
  const { user, assistant, refId, model, sessionSummary } = opts;

  let raw = "";
  let planJson: any = {};
  try {
    const msgs = await plannerMessages({ user, assistant, sessionSummary });
    const r = await chatCompletion({
      provider: model.provider,
      model: model.name,
      system: "Return JSON only. Keys: tool_calls (array), actions (array).",
      messages: msgs as any,
    });
    raw = typeof r === "string" ? r : (r as any)?.content ?? "";
    planJson = JSON.parse(safeExtractJson(raw));
  } catch {
    planJson = { tool_calls: [], actions: [] };
  }

  const parsed = PlanSchema.safeParse(planJson);
  const plan = parsed.success ? parsed.data : { tool_calls: [], actions: [] };

  const toolResults: Array<{ server: string; method: string; params?: any; result: any; latency_ms: number }> = [];
  for (const call of plan.tool_calls) {
    try {
      const { result, latency_ms } = await callTool(call.server, call.method, call.params || {});
      toolResults.push({ server: call.server, method: call.method, params: call.params, result, latency_ms });
    } catch (e) {
      console.warn(`[ACTIONS] Tool call failed: ${call.server}.${call.method}`, e);
    }
  }

  const out: Action[] = [];
  for (const a of plan.actions) {
    const coerced = coerceVisualAction(a, refId);
    if (coerced) {
      if (toolResults.length) {
        const total = toolResults.reduce((s, t) => s + (t.latency_ms || 0), 0);
        coerced.meta = { ...(coerced.meta || {}), latency_ms: total, tool: toolResults.map(t => `${t.server}.${t.method}`).join(",") };
      }
      out.push(coerced);
      continue;
    }
    if (a?.kind === "note" && a?.type === "suggestions") {
      out.push({ ...(a as any), refId });
    }
  }

  if (!out.some(a => a.kind === "visual") && toolResults.length >= 2) {
    const bar = buildBarFromToolResults(refId, toolResults);
    if (bar) out.push(bar);
  }

  if (!out.some(a => a.kind === "visual") && toolResults.length) {
    const successfulResults = toolResults.filter(tr => {
      if (!tr.result || typeof tr.result !== 'object') return true;
      const resultStr = JSON.stringify(tr.result).toLowerCase();
      return !resultStr.includes('error') && 
             !resultStr.includes('validation') && 
             !resultStr.includes('missing') && 
             !resultStr.includes('required') &&
             !resultStr.includes('failed') &&
             !resultStr.includes('exception');
    });
    if (successfulResults.length > 0) {
      const rows: any[][] = [];
      for (const tr of successfulResults) {
        const v = summarizeToolResult(tr.result);
        const label = tr.params?.year ?? tr.params?.years ?? tr.params?.label ?? "";
        rows.push([`${tr.server}.${tr.method}`, label, v.value, v.units || ""]);
      }
      if (rows.length) {
        out.push({
          v: 1,
          refId,
          kind: "visual",
          type: "table",
          title: "Tool results",
          payload: { columns: ["Metric", "Label", "Value", "Units"], rows },
          meta: { tool: successfulResults.map((t) => `${t.server}.${t.method}`).join(",") },
        } as any);
      }
    }
  }

  return out;
}
