import axios, { type InternalAxiosRequestConfig } from "axios";

// One place to change origin (dev/prod). Defaults to your current setup.
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8787";
export const API_V1_BASE = `${API_ORIGIN}/api/v1`;

const api = axios.create({
  baseURL: API_V1_BASE,
});

// keep your existing header logic; support both AxiosHeaders & plain object
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const uid = localStorage.getItem("itotem_user") || "demo@local";
  // @ts-ignore — works for AxiosHeaders
  config.headers?.set?.("X-User-Id", uid);
  (config.headers as any)["X-User-Id"] = uid;
  return config;
});

export default api;
