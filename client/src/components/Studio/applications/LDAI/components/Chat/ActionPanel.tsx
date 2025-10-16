// frontend/src/applications/LDAI/components/Chat/ActionPanel.tsx
import { ChevronLeft, ChevronRight, Reply, Telescope } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "./useChatStore";
import ActionPanelRenderer from "../ActionPanelRenderer";
import type { Action } from "../../types/Action";

export default function ActionPanel() {
  const { panelOpen, setPanelOpen, turns, actionsByRef, chatScrollTop, setDraft } = useChatStore();

  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const prevLastRef = useRef<string | undefined>(undefined);

  const assistantRefs = useMemo(
    () => turns.filter((t) => t.role === "assistant" && t.refId).map((t) => t.refId!) as string[],
    [turns]
  );
  const lastRef = assistantRefs.length ? assistantRefs[assistantRefs.length - 1] : undefined;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = panelScrollRef.current;
    if (el) el.scrollTop = chatScrollTop;
  }, [chatScrollTop]);

  useEffect(() => {
    if (!assistantRefs.length) {
      setExpanded({});
      prevLastRef.current = undefined;
      return;
    }
    const curr = assistantRefs[assistantRefs.length - 1];
    if (prevLastRef.current !== curr) {
      const next: Record<string, boolean> = {};
      for (const r of assistantRefs) next[r] = r === curr;
      setExpanded(next);
      prevLastRef.current = curr;
    } else {
      setExpanded((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const r of assistantRefs) {
          if (!(r in next)) { next[r] = r === curr; changed = true; }
        }
        return changed ? next : prev;
      });
    }
  }, [assistantRefs]);

  const toggleRef = (ref: string) => setExpanded((p) => ({ ...p, [ref]: !p[ref] }));

  if (!panelOpen) {
    const total = assistantRefs.reduce((sum, ref) => sum + ((actionsByRef[ref] || []).length), 0);
    return (
      <div className="relative w-[88px] border-l border-gray-200 bg-gray-50 flex flex-col items-center">
        <div className="mt-3 text-[11px] text-gray-600 rotate-90 origin-center whitespace-nowrap font-mono">
          {total} {total === 1 ? "action" : "actions"}
        </div>
        <div className="flex-1 w-full relative flex flex-col justify-end items-center pb-10">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-100" />
          <div className="relative w-full flex flex-col items-center px-2">
            {assistantRefs.slice(-6).map((ref) => (
              <div key={ref} className="w-full flex items-center justify-center gap-1 mt-2">
                <div className={`w-2 h-2 rounded-full ${ref === lastRef ? "bg-teal-500/70" : "bg-gray-300"}`} />
                <div className="text-[10px] text-gray-500 font-mono">#{ref}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 left-3 z-10">
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs shadow-sm hover:bg-gray-100"
          >
            <ChevronLeft size={14} />
            Expand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative transition-all duration-200 w-[35%] min-w-[380px] border-l border-gray-200 bg-gray-50 h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="text-sm font-medium">Action Panel</div>
        </div>
      </div>

      <div ref={panelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {!assistantRefs.length ? (
          <div className="h-full flex flex-col items-center mt-10 text-gray-500">
            <Telescope className="mb-3 text-teal-700" size={56} />
            <div className="text-sm">Start a conversation to view actions & visuals here.</div>
          </div>
        ) : (
          assistantRefs.map((ref) => {
            const acts = (actionsByRef[ref] || []) as Action[];
            const has = acts.length > 0;
            const isOpen = !!expanded[ref];

            return (
              <div key={ref} className="bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium px-4 py-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${has ? "bg-teal-600" : "bg-gray-300"}`} />
                  <span className="text-[10px] text-gray-500 font-mono">#{ref}</span>
                  <span className="text-sm">Assets{has ? ` (${acts.length})` : ""}</span>
                  <button
                    className="ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                    onClick={() => setDraft(`Re: #${ref} `)}
                  >
                    Reply <Reply size={12} />
                  </button>
                  {has ? (
                    <button
                      onClick={() => toggleRef(ref)}
                      className="ml-2 text-[11px] px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                    >
                      {isOpen ? "Hide" : "Show"}
                    </button>
                  ) : null}
                </div>

                {has ? (isOpen ? (
                  <div className="px-4 pb-4">
                    <ActionPanelRenderer actions={acts} />
                  </div>
                ) : null) : (
                  <div className="px-4 pb-3 text-[11px] text-gray-400">No Actions</div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-10">
        <button
          onClick={() => setPanelOpen(false)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs shadow-sm hover:bg-gray-100"
        >
          Collapse <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
