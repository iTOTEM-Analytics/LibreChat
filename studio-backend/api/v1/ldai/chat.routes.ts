import { Router } from "express";
import {
  chatOnce,
  listTools,
  getConfig,
  streamLLM,
  saveTurnAfterStream,
  appendActions,
} from "./chat.service";
import { inferAndExecuteActions } from "./actions.pipeline";

const r = Router();

// Make /chat tool-aware by calling chatOnce (which now exposes tools internally)
r.post("/chat", async (req, res) => {
  const { message, sessionId, modelId } = req.body || {};
  const out = await chatOnce({ message, sessionId, modelId });
  
  // Also call action pipeline for regular chat requests
  let actions: any[] = [];
  try {
    actions = await inferAndExecuteActions({
      user: message,
      assistant: out.answer,
      refId: out.refId,
      model: { provider: "openai", name: "gpt-4o-mini" }, // Use default model
    });
    if (actions.length) {
      await appendActions({ sid: out.sessionId, refId: out.refId, actions });
    }
  } catch (e) {
    console.error("Action pipeline error:", e);
  }
  
  res.json({ ...out, actions });
});

r.get("/tools", async (_req, res) => res.json(await listTools()));
r.get("/config", async (_req, res) => res.json(await getConfig()));

r.get("/stream", async (req, res) => {
  const message = String(req.query.message || "");
  const sessionId = (req.query.sessionId as string) || undefined;
  const modelId = (req.query.modelId as string) || undefined;
  if (!message.trim()) return res.status(400).json({ error: "missing message" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  // @ts-ignore
  req.socket?.setKeepAlive?.(true, 15000);
  res.flushHeaders?.();

  const { sid, refId, provider, model, system, history } =
    await streamLLM({ message, sessionId, modelId });

  res.write(`event: start\ndata: ${JSON.stringify({ sessionId: sid, refId })}\n\n`);

  let finalText = "";
  let closed = false;
  let suggestionSent = false;
  req.on("close", () => { closed = true; });

  try {
    for await (const chunk of history.stream({ provider, model, system })) {
      if (closed) break;
      finalText += chunk;
      
      try {
        res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
      } catch (e) {
        console.log("[STREAM] Failed to write delta chunk:", e);
        break;
      }
      
      // Only generate visual actions early, NOT suggestions (they need complete context)
      if (!suggestionSent && finalText.length > 30) {
        inferAndExecuteActions({
          user: message,
          assistant: finalText,
          refId,
          model: { provider: provider as any, name: model },
        }).then(actions => {
          if (closed) return;
          // Only send visual actions early, save suggestions for later
          const visualActions = actions.filter(a => a.kind === "visual");
          if (visualActions.length > 0) {
            appendActions({ sid, refId, actions: visualActions }).then(() => {
              if (!closed) {
                try {
                  res.write(`event: actions\ndata: ${JSON.stringify({ refId, actions: visualActions })}\n\n`);
                  suggestionSent = true; // Mark visual actions as sent
                } catch (e) {
                  console.log("[STREAM] Failed to write visual actions:", e);
                }
              }
            }).catch((e) => {
              console.log("[STREAM] Failed to append visual actions:", e);
            });
          }
        }).catch((e) => {
          console.log("[STREAM] Early visual action generation failed:", e);
        });
      }
    }
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.log("[STREAM] Streaming error:", e);
    if (!closed) {
      try {
        res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
        res.write(`event: done\ndata: {}\n\n`);
      } catch (writeError) {
        console.log("[STREAM] Failed to write error event:", writeError);
      }
      return res.end();
    }
  }

  if (!closed) {
    await saveTurnAfterStream({ sid, refId, user: message, answer: finalText });

    try {
      // Always generate suggestions at the end with complete context
      const actions = await inferAndExecuteActions({
        user: message,
        assistant: finalText,
        refId,
        model: { provider: provider as any, name: model },
      });
      
      // If we already sent visual actions, only send suggestions now
      // If we haven't sent any actions yet, send everything
      const actionsToSend = suggestionSent 
        ? actions.filter(a => a.kind === "note") 
        : actions;
      
      if (actionsToSend.length > 0) {
        await appendActions({ sid, refId, actions: actionsToSend });
        res.write(`event: actions\ndata: ${JSON.stringify({ refId, actions: actionsToSend })}\n\n`);
      }
    } catch (e) {
      console.log("[STREAM] Final action generation failed:", e);
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  }
});

export default r;