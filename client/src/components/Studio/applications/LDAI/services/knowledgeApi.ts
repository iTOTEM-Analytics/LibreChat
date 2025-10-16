import api from "../../../api/axios";

export async function kbList() {
  const r = await api.get("/ldai/knowledge");
  return r.data.items as any[];
}

export async function kbUploadJson(name: string, text: string, tags?: string[]) {
  const r = await api.post("/ldai/knowledge/upload-json", { name, text, tags });
  return r.data.item as any;
}

export async function kbRetrieve(q: string, k = 3) {
  const r = await api.get("/ldai/knowledge/retrieve", { params: { q, k } });
  return r.data.items as Array<{ id: string; name: string; snippet: string }>;
}
