import { Router } from "express";
import { callTool, listAllTools, listAllToolDefs } from "./mcp.service";

const r = Router();

r.get("/mcp/tools", async (_req, res) => {
  try {
    const servers = await listAllTools();
    res.json({ servers });
  } catch (e:any) { res.status(500).json({ error:String(e?.message||e) }); }
});

r.get("/mcp/tools/defs", async (_req, res) => {
  try {
    const servers = await listAllToolDefs();
    res.json({ servers });
  } catch (e:any) { res.status(500).json({ error:String(e?.message||e) }); }
});

r.post("/mcp/tools/call", async (req, res) => {
  const { server, method, params } = req.body || {};
  if (!server || !method) return res.status(400).json({ error:"missing server/method" });
  try {
    const out = await callTool(server, method, params || {});
    res.json(out);
  } catch (e:any) { res.status(500).json({ error:String(e?.message||e) }); }
});

export default r;
