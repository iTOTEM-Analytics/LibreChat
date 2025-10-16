// frontend/src/applications/LDAI/types/Action.ts
export type ActionKind = "visual" | "note";
export type ActionType = "table" | "plotly_bar" | "plotly_pie" | "map_osm" | "form_contact" | "download" | "contact_card" | "insight_card" | "website_card";

export interface Action {
  refId: string;
  kind: ActionKind;
  type: ActionType;
  title?: string;
  payload?: any;
  meta?: { tool?: string; latency_ms?: number };
}
