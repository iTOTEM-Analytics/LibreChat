import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

type Project = {
  id: string;
  name: string;
  connectedProject: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
};
type Store = { users: Record<string, Project[]> };

const DATA_FILE = path.join(__dirname, "data", "storyprojects.json");

function ensure() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2));
}
function readStore(): Store {
  ensure();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Store; }
  catch { return { users: {} }; }
}
function writeStore(s: Store) {
  ensure();
  fs.writeFileSync(DATA_FILE, JSON.stringify(s, null, 2));
}
function getUserId(req: Request) {
  return String(req.header("X-User-Id") || process.env.DEMO_USER_ID || "demo@local");
}

export function getProjects(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const s = readStore();
    res.json(s.users[userId] || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
}

export function createProject(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { name, connectedProject = "", description = "" } = req.body || {};
    if (!name) return res.status(400).json({ error: "Name is required" });

    const s = readStore();
    const now = new Date().toISOString();
    const p: Project = {
      id: randomUUID(),
      name,
      connectedProject,
      description,
      createdAt: now,
      updatedAt: now,
    };
    const list = s.users[userId] || [];
    s.users[userId] = [p, ...list];
    writeStore(s);
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create project" });
  }
}

export function updateProject(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, connectedProject, description } = req.body || {};

    const s = readStore();
    const list = s.users[userId] || [];
    const i = list.findIndex((x) => x.id === id);
    if (i === -1) return res.status(404).json({ error: "Not found" });

    list[i] = {
      ...list[i],
      name: name ?? list[i].name,
      connectedProject: connectedProject ?? list[i].connectedProject,
      description: description ?? list[i].description,
      updatedAt: new Date().toISOString(),
    };
    s.users[userId] = list;
    writeStore(s);
    res.json(list[i]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update project" });
  }
}

export function deleteProject(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const s = readStore();
    const list = s.users[userId] || [];
    s.users[userId] = list.filter((x) => x.id !== id);
    writeStore(s);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete project" });
  }
}
