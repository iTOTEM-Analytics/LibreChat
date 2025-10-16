// src/api/storyfinder.ts
import axios from "axios";
import api from "./axios";
import type { StoryProject } from "../types/storyfinder";

const API_URL = "http://localhost:8787/api/v1/storyfinder";

export async function getProjects(): Promise<StoryProject[]> {
  const res = await axios.get(`${API_URL}/projects`);
  return res.data;
}

export async function createProject(payload: Omit<StoryProject, "id" | "createdAt" | "updatedAt">): Promise<StoryProject> {
  const res = await axios.post(`${API_URL}/projects`, payload);
  return res.data;
}

export async function updateProject(payload: StoryProject): Promise<StoryProject> {
  const res = await axios.put(`${API_URL}/projects/${payload.id}`, payload);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await axios.delete(`${API_URL}/projects/${id}`);
}

// ---- run/candidates
export type StartRunRequest = {
  projectId: string;
  source: {
    mode: "upload" | "existing" | "manual";
    vendorCol?: string;
    cityCol?: string;
    provinceCol?: string;
    fileLabel?: string;
    rows?: Record<string, any>[];
    manual?: { name: string; location?: string }[];
  };
  locationBias?: string;
  criteriaMode?: "auto" | "public";
  focus: "innovation" | "sustainability" | "growth";
  limit: number;
};

export async function startRunApi(body: StartRunRequest): Promise<{ jobId: string; projectId: string; runId: string }> {
  const res = await axios.post(`${API_URL}/run`, body);
  return res.data;
}

export type Candidate = {
  id: string;
  vendor_name?: string;
  city?: string;
  province?: string;
  candidate_score?: number | string | null;
  description?: string | null;
  llm_website?: string | null;
  google_api_website?: string | null;
  extended?: {
    summary?: string | null;
    top_clients?: string[] | null;
    awards?: string[] | null;
  };
  logo_url?: string | null; // <- from backend
};

export async function listCandidatesApi(projectId: string): Promise<Candidate[]> {
  const res = await axios.get(`${API_URL}/candidates`, { params: { projectId } });
  return res.data;
}
export async function clearCandidatesApi(projectId: string): Promise<void> {
  await axios.delete(`${API_URL}/candidates`, { params: { projectId } });
}

export function openEvents(jobId: string) {
  const url = `${API_URL}/events?jobId=${encodeURIComponent(jobId)}`;
  return new EventSource(url);
}

// ---- NEW helpers ----
export async function fetchInitialRows(projectId: string): Promise<any[]> {
  const { data } = await api.get(`/storyfinder/initial`, { params: { projectId } });
  return data?.rows || [];
}

export async function cancelRun(jobId: string): Promise<void> {
  await api.post(`/storyfinder/cancel`, null, { params: { jobId } });
}

export async function getJob(jobId: string): Promise<{
  jobId: string; projectId: string; started: boolean; closed: boolean; cancelled: boolean; stage: string; batchIndex: number;
}> {
  const { data } = await api.get(`/storyfinder/jobs/${jobId}`);
  return data;
}

export type RunRecord = {
  id: string;
  projectId: string;
  createdAt: string;
  finishedAt?: string;
  cancelledAt?: string;
  status: "created" | "running" | "done" | "cancelled";
  stage?: "idle" | "preprocess" | "rank" | "enrich" | "finalize";
  params: { limit: number; focus: "innovation" | "sustainability" | "growth" };
  rowsCount: number;
};

export async function listRuns(projectId: string): Promise<RunRecord[]> {
  const { data } = await api.get(`/storyfinder/runs`, { params: { projectId } });
  return data;
}

export async function resumeRun(projectId: string, limit: number, focus: "innovation" | "sustainability" | "growth") {
  const { data } = await api.post(`/storyfinder/resume`, { projectId, limit, focus });
  return data as { jobId: string; projectId: string; runId: string };
}
