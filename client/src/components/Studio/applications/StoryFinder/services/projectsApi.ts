import api from "../../../api/axios";

export type StoryCollection = {
  id: string;
  name: string;
  connectedProject: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
};

export async function getProjects(): Promise<StoryCollection[]> {
  const res = await api.get("/storyfinder/collections");
  return res.data;
}

export async function createProject(payload: {
  name: string;
  connectedProject: string;
  description: string;
}): Promise<StoryCollection> {
  const res = await api.post("/storyfinder/collections", payload);
  return res.data;
}

export async function updateProject(payload: {
  id: string;
  name: string;
  connectedProject: string;
  description: string;
}): Promise<StoryCollection> {
  const res = await api.put(`/storyfinder/collections/${payload.id}`, payload);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/storyfinder/collections/${id}`);
}
