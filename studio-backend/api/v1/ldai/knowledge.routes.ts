import { Router } from "express";
import { addKnowledgeText, listKnowledge, retrieveKnowledge } from "./knowledge.service";
import { refreshProjectKnowledge } from "./chat.service";

const r = Router();

r.get("/knowledge", async (_req, res) => {
  res.json({ items: await listKnowledge() });
});

r.post("/knowledge/upload-json", async (req, res) => {
  const { name, text, tags } = req.body || {};
  if (!name || !text) return res.status(400).json({ error: "name and text required" });
  const item = await addKnowledgeText({ name, text, tags });
  res.json({ item });
});

r.get("/knowledge/retrieve", async (req, res) => {
  const q = String(req.query.q || "");
  if (!q.trim()) return res.status(400).json({ error: "q required" });
  const items = await retrieveKnowledge(q, Number(req.query.k || 3));
  res.json({ items });
});

r.post("/knowledge/refresh-project", async (_req, res) => {
  try {
    await refreshProjectKnowledge();
    res.json({ success: true, message: "Project knowledge cache refreshed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh project knowledge" });
  }
});

export default r;
