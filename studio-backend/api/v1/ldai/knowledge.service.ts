import fs from "fs/promises";
import path from "path";

const dataDir = path.join(__dirname, "data");
const idxFile = path.join(dataDir, "knowledge_index.json");
const storeDir = path.join(dataDir, "knowledge");

type KBItem = {
  id: string;
  name: string;
  tags?: string[];
  text: string;      // plain text for MVP
  addedAt: number;
};

async function ensure() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(storeDir, { recursive: true });
  try { await fs.access(idxFile); } catch { await fs.writeFile(idxFile, JSON.stringify({ items: [] }, null, 2)); }
}

async function readIdx(): Promise<{ items: KBItem[] }> {
  await ensure();
  return JSON.parse(await fs.readFile(idxFile, "utf-8"));
}
async function writeIdx(obj: { items: KBItem[] }) {
  await fs.writeFile(idxFile, JSON.stringify(obj, null, 2));
}

export async function listKnowledge() {
  const idx = await readIdx();
  return idx.items;
}

export async function addKnowledgeText({ name, text, tags }: { name: string; text: string; tags?: string[] }) {
  const idx = await readIdx();
  const id = (idx.items.length + 1).toString();
  const item: KBItem = { id, name, text, tags, addedAt: Date.now() };
  idx.items.push(item);
  await writeIdx(idx);
  // also persist raw as file
  await fs.writeFile(path.join(storeDir, `${id}.txt`), text);
  return item;
}

// very simple keyword retriever (MVP)
export async function retrieveKnowledge(q: string, k = 3) {
  const idx = await readIdx();
  const qq = q.toLowerCase();
  const scored = idx.items.map((it) => {
    const t = it.text.toLowerCase();
    let score = 0;
    for (const token of qq.split(/\s+/)) {
      if (!token) continue;
      if (t.includes(token)) score += 1;
    }
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ it }) => ({ id: it.id, name: it.name, snippet: it.text.slice(0, 800) }));
}
