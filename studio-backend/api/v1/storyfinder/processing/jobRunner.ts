// backend/api/v1/storyfinder/processing/jobRunner.ts
import { Candidate, InitialRow } from "../types";
import { randomUUID } from "crypto";
import { enrichBatch } from "./llmWorker";

type Client = { id: string; res: any };

type Job = {
  id: string;
  projectId: string;
  rows: InitialRow[];
  limit: number;
  focus: "innovation" | "sustainability" | "growth";
  clients: Client[];
  started: boolean;
  closed: boolean;
  cancelled: boolean;
  stage: "idle" | "preprocess" | "rank" | "enrich" | "finalize";
  batchIndex: number;
  appendCandidates: (projectId: string, part: Candidate[]) => Promise<void>;
  mergeCandidates: (projectId: string, updates: Candidate[]) => Promise<void>;
};

const jobs = new Map<string, Job>();

export function createJob(
  projectId: string,
  rows: InitialRow[],
  limit: number,
  focus: "innovation" | "sustainability" | "growth",
  appendCandidates: (projectId: string, part: Candidate[]) => Promise<void>,
  mergeCandidates: (projectId: string, updates: Candidate[]) => Promise<void>
) {
  const j: Job = {
    id: randomUUID(),
    projectId,
    rows,
    limit,
    focus,
    clients: [],
    started: false,
    closed: false,
    cancelled: false,
    stage: "idle",
    batchIndex: -1,
    appendCandidates,
    mergeCandidates,
  };
  jobs.set(j.id, j);
  return j;
}

export function attachClient(jobId: string, res: any) {
  const job = jobs.get(jobId);
  if (!job) return false;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(":\n\n"); // initial ping

  const id = randomUUID();
  job.clients.push({ id, res });

  // start the job only when the first client subscribes
  if (!job.started) {
    job.started = true;
    runBatches(job).catch(() => {});
  }

  // cleanup on client disconnect
  res.on?.("close", () => {
    job.clients = job.clients.filter((c) => c.id !== id);
  });

  return true;
}

export function cancelJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return false;
  job.cancelled = true;
  return true;
}

export function getJobStatus(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return null;
  return {
    jobId: job.id,
    projectId: job.projectId,
    started: job.started,
    closed: job.closed,
    cancelled: job.cancelled,
    stage: job.stage,
    batchIndex: job.batchIndex,
  };
}

// ----- internal helpers -----
function send(job: Job, event: string, data: any) {
  for (const c of job.clients) {
    try {
      c.res.write(`event: ${event}\n`);
      c.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  }
}

function close(job: Job) {
  if (job.closed) return;
  job.closed = true;
  for (const c of job.clients) {
    try {
      c.res.end();
    } catch {}
  }
  jobs.delete(job.id);
}

async function runBatches(job: Job) {
  if (job.cancelled) {
    send(job, "cancelled", {});
    close(job);
    return;
  }

  job.stage = "preprocess";
  send(job, "stage", { stage: "preprocess", done: true });

  const pick = job.rows.slice(0, Math.max(1, job.limit));

  if (job.cancelled) {
    send(job, "cancelled", {});
    close(job);
    return;
  }

  job.stage = "rank";
  send(job, "stage", { stage: "rank", done: true });

  // prepare batches
  const batches: Candidate[][] = [];
  for (let i = 0; i < pick.length; i += 5) {
    const slice = pick.slice(i, i + 5);
    const batch: Candidate[] = slice.map((r, idx) => ({
      id: `${Date.now()}-${i + idx}`,
      projectId: job.projectId,
      vendor_name: r.vendor_name,
      city: r.city ?? null,
      province: r.province ?? null,
      candidate_score: 65 + Math.round(Math.random() * 30),
      description: "Potential narrative opportunity",
      google_api_website: r.google_api_website ?? null,
      llm_website: null,
    }));
    batches.push(batch);
  }

  for (let bi = 0; bi < batches.length; bi++) {
    if (job.cancelled) {
      send(job, "cancelled", {});
      close(job);
      return;
    }

    job.batchIndex = bi;

    // 1) append & emit partial for immediate UI feedback
    await job.appendCandidates(job.projectId, batches[bi]);
    send(job, "partial", { batch: batches[bi], batchIndex: bi });

    // 2) enrich (phase-2) & emit enriched, then persist merge
    job.stage = "enrich";
    const enriched = await enrichBatch(batches[bi], {
      projectId: job.projectId,
      focus: job.focus,
    });
    await job.mergeCandidates(job.projectId, enriched);
    send(job, "enriched", { batch: enriched, batchIndex: bi });

    // small pacing so UI can render
    await new Promise((r) => setTimeout(r, 150));
  }

  job.stage = "finalize";
  send(job, "stage", { stage: "finalize", done: true });
  send(job, "done", { total: pick.length });
  close(job);
}
