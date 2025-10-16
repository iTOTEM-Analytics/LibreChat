// frontend/src/applications/LDAI/components/Chat/ChatWindow.tsx
import { useEffect, useMemo, useRef } from "react";
import Message from "./Message";

import SuggestedInitialPrompts from "./SuggestedInitialPrompts";
import InlineOptions from "./InlineOptions";
import { SendHorizonal, Paperclip, Trash2, MessageSquareDot } from "lucide-react";
import { useChatStore } from "./useChatStore";
import { streamLdaiMessage, sendLdaiMessage } from "../../services/ldaiClient";

const PRESETS = [
  "Summarize regional risks near Austin.",
  "Draft a short email to a city official.",
  "How would a $15k turtle CI affect fish in 2 years?",
];

export default function ChatWindow() {
  const {
    selectedModel,
    sessionId,
    panelOpen,
    setPanelOpen,
    draft,
    setDraft,
    setSession,
    addTurn,
    setActions,
    setLastAssistantRef,
    appendToLastAssistant,
    setRefPositions,
    setChatContentHeight,
    setSuggestions,
    setIsStreaming,
    isStreaming,
    inputPlaceholder,
    setChatScrollTop,
  } = useChatStore();

  const turns = useChatStore((s) => s.turns);
  const assistantIndexToRef: Record<number, string> = useMemo(() => {
    const map: Record<number, string> = {};
    turns.forEach((t, idx) => { if (t.role === "assistant" && t.refId) map[idx] = t.refId; });
    return map;
  }, [turns]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cancelRef = useRef<null | (() => void)>(null);
  const lastRefId = useRef<string | null>(null);
  const gotDelta = useRef(false);

  const totalQuota = 50;
  const usedQuota = turns.filter((m) => m.role === "user").length;
  const remainingPercent = Math.max(0, 100 - Math.min((usedQuota / totalQuota) * 100, 100));
  const quotaColor = remainingPercent <= 20 ? "bg-red-400" : "bg-teal-500";

  const firstMessagePhase = useMemo(() => turns.every((t) => t.role !== "user"), [turns]);
  const ghostTail = useMemo(() => {
    if (!firstMessagePhase || !draft) return "";
    const hit = PRESETS.find((p) => p.toLowerCase().startsWith(draft.toLowerCase()));
    if (!hit || hit.length <= draft.length) return "";
    return hit.slice(draft.length);
  }, [draft, firstMessagePhase]);

  // Smooth scroll during streaming to keep new content visible
  useEffect(() => {
    if (isStreaming) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [turns.length, isStreaming]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => useChatStore.getState().setChatScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    const positions: Record<string, number> = {};
    Object.entries(msgRefs.current).forEach(([idxStr, node]) => {
      const idx = Number(idxStr);
      if (!node) return;
      const refId = assistantIndexToRef[idx];
      if (!refId) return;
      const rect = node.getBoundingClientRect();
      // Get the message's actual center position for perfect alignment
      const messageCenter = rect.top - containerTop + container.scrollTop + (rect.height / 2);
      // Offset by a small amount to account for action panel padding and center with action content
      const topPosition = messageCenter - 24; // Adjust this value to fine-tune alignment
      positions[refId] = topPosition;
    });
    setRefPositions(positions);
    setChatContentHeight(container.scrollHeight);
    
    // Sync Action Panel scroll position with chat scroll
    setChatScrollTop(container.scrollTop);
    
    // Add scroll event listener for real-time sync
    const handleScroll = () => {
      setChatScrollTop(container.scrollTop);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [turns, assistantIndexToRef, setRefPositions, setChatContentHeight, setChatScrollTop]);

  // Auto-scroll to ensure new messages are visible
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    
    // If this is the first user message, ensure it's visible but not at the very top
    if (turns.length === 1 && turns[0].role === "user") {
      // Scroll to show the message with some breathing room at the top
      const firstMsgElement = msgRefs.current[0];
      if (firstMsgElement) {
        const rect = firstMsgElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetScrollTop = container.scrollTop + rect.top - containerRect.top - 40; // 40px breathing room
        container.scrollTop = Math.max(0, targetScrollTop);
      }
    }
    // For subsequent messages, scroll to bottom only when not streaming
    else if (turns.length > 1 && !isStreaming) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [turns.length, isStreaming]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Don't clear suggestions here - let them clear naturally through the onStart callback

    addTurn({ role: "user", content: trimmed });
    addTurn({ role: "assistant", content: "" });

    setDraft("");
    setIsStreaming(true);
    gotDelta.current = false;
    lastRefId.current = null;

    cancelRef.current = streamLdaiMessage({
      message: trimmed,
      sessionId,
      modelId: selectedModel,

      onStart: ({ sessionId: sid, refId }) => {
        setSession(sid);
        setLastAssistantRef(refId);
        lastRefId.current = refId;
        // Don't clear actions here - let them accumulate
        setSuggestions(refId, undefined);
      },

      onDelta: (tok) => {
        gotDelta.current = true;
        appendToLastAssistant(tok);
      },

      onDone: async () => {
        setIsStreaming(false);
        cancelRef.current = null;

        if (!gotDelta.current) {
          try {
            const r = await sendLdaiMessage(trimmed, sessionId, selectedModel);
            appendToLastAssistant(r.answer || "");
            if (r.refId && !lastRefId.current) {
              setLastAssistantRef(r.refId);
              lastRefId.current = r.refId;
            }
            if (Array.isArray(r.actions) && r.actions.length) dispatchActions(r.refId, r.actions);
          } catch {
            appendToLastAssistant("⚠️ Fallback failed.");
          }
        }
      },

      onError: async (errMsg) => {
        appendToLastAssistant(`⚠️ Streaming error: ${errMsg}`);
        try {
          const r = await sendLdaiMessage(trimmed, sessionId, selectedModel);
          appendToLastAssistant("\n" + (r.answer || ""));
          if (r.refId && !lastRefId.current) {
            setLastAssistantRef(r.refId);
            lastRefId.current = r.refId;
          }
          if (Array.isArray(r.actions) && r.actions.length) dispatchActions(r.refId, r.actions);
        } catch {
          appendToLastAssistant("\n⚠️ Fallback failed.");
        }
        setIsStreaming(false);
        cancelRef.current = null;
      },

      onActions: (ref, acts) => {
        dispatchActions(ref, acts);
      },
    });
  };

  function dispatchActions(ref: string, acts: any[]) {
    console.log("[DEBUG] dispatchActions called with:", { ref, acts });
    
    const visuals = acts
      .filter((a: any) => a.kind === "visual")
      .map((a: any) => ({
        kind: "visual" as const,
        type: a.type,
        title: a.title,
        payload: a.payload,
        meta: a.meta,
        refId: a.refId,
        panel: "auto_open" as const,
      }));
    setActions(ref, visuals);
    if (visuals.length) setPanelOpen(true);

    const sug = acts.find((a: any) => a.kind === "note" && a.type === "suggestions");
    console.log("[DEBUG] Found suggestion:", sug);
    if (sug) {
      const suggestionData = {
        next: sug?.payload?.next,
        option_type: sug?.payload?.option_type,
        options: sug?.payload?.options,
        placeholder: sug?.payload?.placeholder,
        schema: sug?.payload?.schema,
      };
      console.log("[DEBUG] Setting suggestion:", suggestionData);
      useChatStore.getState().setSuggestions(ref, suggestionData);
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim() && !isStreaming) send(draft);
  };

  const onReply = (refId: string) => {
    setDraft(`Re: #${refId} `);
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="fixed top-[72px] right-8 w-36 z-40 text-xs">
        <div className="flex justify-between text-gray-500 mb-1">
          <span>Quota left</span>
          <span>{Math.max(0, totalQuota - usedQuota)}/{totalQuota}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${quotaColor} transition-all duration-300`} style={{ width: `${remainingPercent}%` }} />
        </div>
      </div>

      {/* Your updated Clear History button */}
      {turns.length > 0 && (
        <div className="fixed top-[130px] z-40">
          <button
            onClick={() => useChatStore.getState().clearHistory()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:text-red-800 hover:border-red-800 text-slate-700 text-xs rounded-lg border border-gray-200 transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={14} />
            Clear History
          </button>
        </div>
      )}

      <div ref={listRef} className="flex-1 px-4 overflow-y-auto flex flex-col pb-36">
        <div className={`w-full ${panelOpen ? "sm:w-[75vw] lg:w-[60vw] max-w-[800px]" : "sm:w-[80vw] lg:w-[55vw] max-w-[900px]"} ${panelOpen ? "mx-0" : "mx-auto"} space-y-4 py-4`}>
          {/* Startup Screen */}
          {turns.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center mt-10 text-gray-500">
              <MessageSquareDot className="mb-3 text-teal-700" size={56} />
              <div className="text-lg font-semibold">What can I help you with?</div>
              <div className="mt-6 w-full max-w-[600px]">
                <SuggestedInitialPrompts onPick={(t) => send(t)} />
              </div>
            </div>
          )}
          
          {turns.map((t, i) => (
            <div key={i} ref={(el) => { msgRefs.current[i] = el; }}>
              <Message role={t.role} content={t.content} refId={t.refId} onReply={onReply} />
              {t.role === "assistant" && t.refId ? <InlineOptions refId={t.refId} onSend={send} /> : null}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className={`w-full ${panelOpen ? "flex justify-start" : "flex justify-center"}`}>
        <form
          onSubmit={submit}
          className={`flex flex-col w-full ${panelOpen ? "sm:w-[75vw] lg:w-[60vw] max-w-[800px]" : "sm:w-[80vw] lg:w-[55vw] max-w-[900px]"} bg-white border border-gray-200 rounded-xl px-4 pt-2 pb-3 shadow-sm m-4 fixed bottom-0 z-40`}
        >
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2 text-gray-500">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 transition"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const base64 = (e.target?.result as string) || "";
                        console.log(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <Paperclip size={18} className="cursor-pointer" />
              </button>
            </div>
            <div className="relative flex-1 mx-4">
              {turns.every(t => t.role !== "user") && ghostTail && (
                <div className="pointer-events-none absolute inset-0 flex items-center text-gray-400">
                  <span className="opacity-0">{draft}</span>
                  <span>{ghostTail}</span>
                </div>
              )}
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={inputPlaceholder}
                className="relative z-10 h-[8vh] w-full text-sm bg-transparent placeholder-gray-400 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition"
                disabled={isStreaming}
                title={isStreaming ? "Waiting for response…" : "Send"}
              >
                <SendHorizonal size={16} className="text-gray-700" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
