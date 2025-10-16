// frontend/src/applications/LDAI/components/Chat/useChatStore.ts
import { create } from "zustand";

export type ActionType =
  | "plotly_bar"
  | "plotly_pie"
  | "map_osm"
  | "form_contact"
  | "table"
  | "download";

export type PanelMode = "auto_open" | "append" | "replace" | "silent";

export type ActionItem = {
  kind: "visual" | "note";
  type: ActionType | "suggestions";
  title?: string;
  payload?: any;
  refId: string;
  meta?: { tool?: string; latency_ms?: number };
  panel?: PanelMode;
};

export type Suggestion =
  | {
      next?: string;
      option_type:
        | "buttons" | "select" | "number" | "range" | "date" | "datetime"
        | "toggle" | "map_point" | "map_bbox" | "year" | "rating"
        | "table_row_select" | "input";
      options?: string[];
      placeholder?: string;
      schema?: any;
    }
  | undefined;

export type Turn = { role: "user" | "assistant"; content: string; refId?: string };

interface ChatStore {
  selectedModel: string;
  sessionId?: string;
  panelOpen: boolean;
  actionsByRef: Record<string, ActionItem[]>;
  suggestionsByRef: Record<string, Suggestion>;
  turns: Turn[];
  draft: string;
  chatScrollTop: number;
  refPositions: Record<string, number>;
  chatContentHeight: number;
  isStreaming: boolean;
  inputPlaceholder: string;
  setModel: (m: string) => void;
  setSession: (id: string) => void;
  setPanelOpen: (v: boolean) => void;
  addTurn: (t: Turn) => void;
  setActions: (refId: string, a: ActionItem[]) => void;
  setSuggestions: (refId: string, s: Suggestion) => void;
  setLastAssistantRef: (refId: string) => void;
  appendToLastAssistant: (delta: string) => void;
  setDraft: (t: string) => void;
  setChatScrollTop: (n: number) => void;
  setRefPositions: (m: Record<string, number>) => void;
  setChatContentHeight: (h: number) => void;
  setIsStreaming: (v: boolean) => void;
  setInputPlaceholder: (t: string) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedModel: "gpt-4o-mini",
  sessionId: undefined,
  panelOpen: true,
  actionsByRef: {},
  suggestionsByRef: {},
  turns: [],
  draft: "",
  chatScrollTop: 0,
  refPositions: {},
  chatContentHeight: 0,
  isStreaming: false,
  inputPlaceholder: "Ask anything!",
  setModel: (m) => set({ selectedModel: m }),
  setSession: (id) => set({ sessionId: id }),
  setPanelOpen: (v) => set({ panelOpen: v }),
  addTurn: (t) => set((s) => ({ turns: [...s.turns, t] })),
  setActions: (refId, a) =>
    set((s) => {
      // Merge new actions with existing ones instead of replacing
      const existing = s.actionsByRef[refId] || [];
      const newActions = a || [];
      
      // Filter out duplicates by checking if an action with the same type already exists
      const merged = [...existing];
      newActions.forEach(newAction => {
        const isDuplicate = existing.some(existingAction => 
          existingAction.kind === newAction.kind && 
          existingAction.type === newAction.type
        );
        if (!isDuplicate) {
          merged.push(newAction);
        }
      });
      
      const next = { ...s.actionsByRef, [refId]: merged };
      const open = merged.length > 0 ? true : s.panelOpen;
      return { actionsByRef: next, panelOpen: open };
    }),
  setSuggestions: (refId, s) =>
    set((st) => {
      console.log("[DEBUG] setSuggestions called:", { refId, suggestion: s });
      const next = { ...st.suggestionsByRef, [refId]: s };
      const ph = s?.option_type === "input" && s?.placeholder ? s.placeholder : st.inputPlaceholder;
      console.log("[DEBUG] Updated suggestionsByRef:", next);
      return { suggestionsByRef: next, inputPlaceholder: ph };
    }),
  setLastAssistantRef: (refId) =>
    set((s) => {
      const idx = [...s.turns].reverse().findIndex((t) => t.role === "assistant");
      if (idx < 0) return {};
      const i = s.turns.length - 1 - idx;
      const copy = [...s.turns];
      copy[i] = { ...copy[i], refId };
      return { turns: copy };
    }),
  appendToLastAssistant: (delta) =>
    set((s) => {
      const idx = [...s.turns].reverse().findIndex((t) => t.role === "assistant");
      if (idx < 0) return {};
      const i = s.turns.length - 1 - idx;
      const copy = [...s.turns];
      copy[i] = { ...copy[i], content: (copy[i].content || "") + delta };
      return { turns: copy };
    }),
  setDraft: (t) => set({ draft: t }),
  setChatScrollTop: (n) => set({ chatScrollTop: n }),
  setRefPositions: (m) => set({ refPositions: m }),
  setChatContentHeight: (h) => set({ chatContentHeight: h }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setInputPlaceholder: (t) => set({ inputPlaceholder: t }),
  clearHistory: () => set({
    turns: [],
    actionsByRef: {},
    suggestionsByRef: {},
    inputPlaceholder: "Ask anything!",
  }),
}));
