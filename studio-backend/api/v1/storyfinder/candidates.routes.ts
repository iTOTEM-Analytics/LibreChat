// backend/api/v1/storyfinder/candidates.routes.ts
import path from "node:path";
import { promises as fs } from "node:fs";
import { Router } from "express";
import projectsRouter from "./projects.routes";
import {
  startRun, events, listCandidates, clearCandidates, cancel, status,
  getInitial, listRuns, getRun, resumeRun
} from "./candidates.service";

const r = Router();

// --- helper(s) for story lookup ---
const STORY_FILE = path.join(__dirname, "data", "generatedstory.json");

// Test endpoint to verify routing
r.get("/test-story-route", (req, res) => {
  res.json({ message: "Story route is working", timestamp: new Date().toISOString() });
});

// Health check for story route
r.get("/story-health", (req, res) => {
  res.json({ 
    message: "Story route health check", 
    timestamp: new Date().toISOString(),
    storyFile: STORY_FILE,
    storyFileExists: require("fs").existsSync(STORY_FILE)
  });
});



function nameKey(s?: string | null) {
  if (!s) return null;
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.,'"]/g, "")
    .replace(/\b(inc|llc|ltd|corp|co|company|limited)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- story by project + candidate (optional ?vendor=) ---
r.get("/projects/:id/candidate/:cid/story", async (req, res) => {
  const { id, cid } = req.params;
  
  console.log(`🔍 Looking for story: projectId=${id}, candidateId=${cid}`);
  console.log(`🌐 Request URL: ${req.originalUrl}`);
  console.log(`📋 Request params:`, req.params);
  console.log(`🚀 Route hit at: ${new Date().toISOString()}`);
  
  try {
    const raw = await fs.readFile(STORY_FILE, "utf8");
    const data = JSON.parse(raw);
    
    console.log(`📁 Loaded ${Array.isArray(data) ? data.length : 'non-array'} stories from file`);

    // Simple matching: find story by projectId AND candidateId
    const match = (doc: any) => {
      const projMatch = String(doc.projectId) === String(id);
      const cidMatch = String(doc.candidateId) === String(cid);
      console.log(`  Checking: ${doc.vendor} - projectId: ${doc.projectId} (${projMatch}), candidateId: ${doc.candidateId} (${cidMatch})`);
      return projMatch && cidMatch;
    };

    let found: any = null;
    if (Array.isArray(data)) {
      found = data.find(match);
    }

    if (!found) {
      console.log(`❌ Story not found for projectId: ${id}, candidateId: ${cid}`);
      return res.status(404).json({ error: "story_not_found" });
    }
    
    console.log(`✅ Found story for ${found.vendor}`);
    return res.json(found);
  } catch (e) {
    console.error("❌ Error reading story file:", e);
    return res.status(404).json({ error: "story_file_missing_or_invalid" });
  }
});

// --- existing routes (keep as-is) ---
r.use(projectsRouter);
r.get("/initial", getInitial);
r.post("/run", startRun);
r.get("/events", events);
r.get("/candidates", listCandidates);
r.delete("/candidates", clearCandidates);
r.get("/runs", listRuns);
r.get("/runs/:id", getRun);
r.post("/resume", resumeRun);
r.post("/cancel", cancel);
r.get("/jobs/:id", status);

export default r;
