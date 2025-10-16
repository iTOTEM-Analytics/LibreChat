// backend/api/v1/storyfinder/types.ts
export type StartRunBody = {
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
  meta?: {
    sourceMode: "upload" | "existing" | "manual";
    vendorCol?: string;
    cityCol?: string;
    provinceCol?: string;
    manual?: { name: string; location?: string }[];
  };
};

export type InitialRow = {
  vendor_name: string;
  city: string | null;
  province: string | null;
  indigenous_flag?: boolean | null;
  nation?: string | null;
  spend?: number | null;
  google_api_website?: string | null;
};

export interface Candidate {
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
  logo_url?: string | null; // <- added
}


export type JsonStoreByProject<T> = {
  projects: Record<string, T[]>;
};

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
