// backend/api/v1/storyfinder/candidates.service.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { buildAndSortInitialDF } from "./processing/preprocess";
import { assertStartRunBody } from "./schema";
import { Candidate, JsonStoreByProject, RunRecord, StartRunBody } from "./types";
import { attachClient, cancelJob, createJob, getJobStatus } from "./processing/jobRunner";
import { randomUUID } from "crypto";

// Import the sync function
const { syncStoryIds } = require("./scripts/syncStoryIds");

const DATA_DIR = path.join(__dirname, "data");
const INIT_FILE = path.join(DATA_DIR, "initial_vendor_data.json");
const CAND_FILE = path.join(DATA_DIR, "storycandidatedata.json");
const RUNS_FILE = path.join(DATA_DIR, "runs.json");

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(INIT_FILE)) fs.writeFileSync(INIT_FILE, JSON.stringify({ projects: {} }, null, 2));
  if (!fs.existsSync(CAND_FILE)) fs.writeFileSync(CAND_FILE, JSON.stringify({ projects: {} }, null, 2));
  if (!fs.existsSync(RUNS_FILE)) fs.writeFileSync(RUNS_FILE, JSON.stringify({ projects: {} }, null, 2));
}
function readJson<T>(file: string): T {
  ensureFiles();
  try { return JSON.parse(fs.readFileSync(file, "utf-8")) as T; }
  catch { return { projects: {} } as any; }
}
function writeJson<T>(file: string, data: T) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function toDomain(u?: string | null): string | null {
  if (!u) return null;
  try {
    const s = u.includes("://") ? u : `https://${u}`;
    const h = new URL(s).hostname.toLowerCase();
    return h.replace(/^www\./, "");
  } catch { return null; }
}
function enrich(c: Candidate, token?: string | null): Candidate {
  const website = c.llm_website || c.google_api_website || null;
  const domain = toDomain(website);
  const logoUrl = domain && token ? `https://img.logo.dev/${domain}?token=${token}&size=96` : null;
  return { ...c, logo_url: logoUrl };
}

function addRun(projectId: string, rowsCount: number, params: RunRecord["params"]): RunRecord {
  const rec: RunRecord = {
    id: randomUUID(),
    projectId,
    createdAt: new Date().toISOString(),
    status: "created",
    params,
    rowsCount,
  };
  const all = readJson<{ projects: Record<string, RunRecord[]> }>(RUNS_FILE);
  const arr = all.projects[projectId] || [];
  all.projects[projectId] = [rec, ...arr];
  writeJson(RUNS_FILE, all);
  return rec;
}
function updateRun(projectId: string, runId: string, patch: Partial<RunRecord>) {
  const all = readJson<{ projects: Record<string, RunRecord[]> }>(RUNS_FILE);
  const arr = all.projects[projectId] || [];
  const i = arr.findIndex((r) => r.id === runId);
  if (i >= 0) {
    arr[i] = { ...arr[i], ...patch };
    all.projects[projectId] = arr;
    writeJson(RUNS_FILE, all);
  }
}

export async function startRun(req: Request, res: Response) {
  try {
    const body = req.body as StartRunBody;
    assertStartRunBody(body);

    const rows = await buildAndSortInitialDF(body);
    const initStore = readJson<JsonStoreByProject<any>>(INIT_FILE);
    initStore.projects[body.projectId] = rows;
    writeJson(INIT_FILE, initStore);

    const run = addRun(body.projectId, rows.length, { limit: body.limit, focus: body.focus });
    const token = process.env.LOGO_DEV_TOKEN || null;

    const append = async (projectId: string, part: Candidate[]) => {
      const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
      const arr = cand.projects[projectId] || [];
      const enriched = part.map((x) => enrich(x, token));
      cand.projects[projectId] = [...arr, ...enriched];
      writeJson(CAND_FILE, cand);
      updateRun(projectId, run.id, { status: "running", stage: "rank" });
      
      // Automatically sync story IDs after adding candidates
      try {
        console.log('🔄 Auto-syncing story IDs after adding candidates...');
        syncStoryIds();
      } catch (error) {
        console.error('⚠️ Auto-sync failed:', error);
      }
    };

    const merge = async (projectId: string, updates: Candidate[]) => {
      const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
      const arr = cand.projects[projectId] || [];
      const map = new Map<string, Candidate>(arr.map((x) => [x.id, x]));
      for (const up of updates.map((x) => enrich(x, token))) {
        const cur = map.get(up.id);
        map.set(up.id, cur ? { ...cur, ...up } : up);
      }
      cand.projects[projectId] = Array.from(map.values());
      writeJson(CAND_FILE, cand);
      updateRun(projectId, run.id, { status: "running", stage: "enrich" });
      
      // Automatically sync story IDs after merging candidates
      try {
        console.log('🔄 Auto-syncing story IDs after merging candidates...');
        syncStoryIds();
      } catch (error) {
        console.error('⚠️ Auto-sync failed:', error);
      }
    };

    const job = createJob(body.projectId, rows, body.limit, body.focus, append, merge);
    res.json({ jobId: job.id, projectId: body.projectId, runId: run.id });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: String(e.message || e) });
  }
}

export async function events(req: Request, res: Response) {
  try {
    const jobId = String(req.query.jobId || "");
    const ok = attachClient(jobId, res);
    if (!ok) return res.status(404).json({ error: "Job not found" });
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

export function getInitial(req: Request, res: Response) {
  const projectId = String(req.query.projectId || "");
  const init = readJson<JsonStoreByProject<any>>(INIT_FILE);
  res.json({ rows: init.projects[projectId] || [] });
}

export function listCandidates(req: Request, res: Response) {
  try {
    const projectId = String(req.query.projectId || "");
    const token = process.env.LOGO_DEV_TOKEN || null;
    const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
    const rows = (cand.projects[projectId] || []).map((c) => enrich(c, token));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

export function clearCandidates(req: Request, res: Response) {
  try {
    const projectId = String(req.query.projectId || "");
    const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
    cand.projects[projectId] = [];
    writeJson(CAND_FILE, cand);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

export function cancel(req: Request, res: Response) {
  try {
    const jobId = String(req.query.jobId || req.body?.jobId || "");
    if (!jobId) return res.status(400).json({ error: "jobId required" });
    const ok = cancelJob(jobId);
    if (!ok) return res.status(404).json({ error: "Job not found" });
    res.json({ ok: true, jobId });
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

export function status(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const st = getJobStatus(id);
    if (!st) return res.status(404).json({ error: "Not found" });
    res.json(st);
  } catch (e: any) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

export function listRuns(req: Request, res: Response) {
  const projectId = String(req.query.projectId || "");
  const all = readJson<{ projects: Record<string, RunRecord[]> }>(RUNS_FILE);
  res.json(all.projects[projectId] || []);
}

export function getRun(req: Request, res: Response) {
  const { id } = req.params;
  const all = readJson<{ projects: Record<string, RunRecord[]> }>(RUNS_FILE);
  for (const arr of Object.values(all.projects)) {
    const hit = arr.find((r) => r.id === id);
    if (hit) return res.json(hit);
  }
  res.status(404).json({ error: "Not found" });
}

export async function resumeRun(req: Request, res: Response) {
  try {
    const { projectId, runId } = req.body;
    if (!projectId || !runId) return res.status(400).json({ error: "missing_project_id_or_run_id" });

    const runs = readJson<{ projects: Record<string, RunRecord[]> }>(RUNS_FILE);
    const projectRuns = runs.projects[projectId] || [];
    const run = projectRuns.find((r) => r.id === runId);
    if (!run) return res.status(404).json({ error: "run_not_found" });
    if (run.status !== "cancelled") return res.status(400).json({ error: "run_not_cancelled" });

    const initStore = readJson<JsonStoreByProject<any>>(INIT_FILE);
    const rows = initStore.projects[projectId] || [];
    if (rows.length === 0) return res.status(400).json({ error: "no_initial_data" });

    const token = process.env.LOGO_DEV_TOKEN || null;

    const append = async (projectId: string, part: Candidate[]) => {
      const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
      const arr = cand.projects[projectId] || [];
      const enriched = part.map((x) => enrich(x, token));
      cand.projects[projectId] = [...arr, ...enriched];
      writeJson(CAND_FILE, cand);
      updateRun(projectId, runId, { status: "running", stage: "rank" });
      
      // Automatically sync story IDs after adding candidates
      try {
        console.log('🔄 Auto-syncing story IDs after resuming and adding candidates...');
        syncStoryIds();
      } catch (error) {
        console.error('⚠️ Auto-sync failed:', error);
      }
    };

    const merge = async (projectId: string, updates: Candidate[]) => {
      const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
      const arr = cand.projects[projectId] || [];
      const map = new Map<string, Candidate>(arr.map((x) => [x.id, x]));
      for (const up of updates.map((x) => enrich(x, token))) {
        const cur = map.get(up.id);
        map.set(up.id, cur ? { ...cur, ...up } : up);
      }
      cand.projects[projectId] = Array.from(map.values());
      writeJson(CAND_FILE, cand);
      updateRun(projectId, runId, { status: "running", stage: "enrich" });
      
      // Automatically sync story IDs after merging candidates
      try {
        console.log('🔄 Auto-syncing story IDs after resuming and merging candidates...');
        syncStoryIds();
      } catch (error) {
        console.error('⚠️ Auto-sync failed:', error);
      }
    };

    const job = createJob(projectId, rows, run.params.limit, run.params.focus, append, merge);
    updateRun(projectId, runId, { status: "running", stage: "idle" });
    res.json({ jobId: job.id, projectId, runId });
  } catch (error) {
    console.error("resumeRun error:", error);
    res.status(500).json({ error: "internal_server_error" });
  }
}

export function getCandidatesSnapshot(): Candidate[] {
  const token = process.env.LOGO_DEV_TOKEN || null;
  const cand = readJson<JsonStoreByProject<Candidate>>(CAND_FILE);
  const all: Candidate[] = [];
  for (const projectCandidates of Object.values(cand.projects)) {
    for (const c of projectCandidates) all.push(enrich(c, token));
  }
  return all;
}
