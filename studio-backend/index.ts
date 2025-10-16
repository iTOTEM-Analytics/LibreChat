// index.ts
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.disable("x-powered-by");                 // optional
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Routers
import projectsRouter from "./api/v1/storyfinder/projects.routes";
import candidatesRouter from "./api/v1/storyfinder/candidates.routes";
import ldaiRouter from "./api/v1/ldai/chat.routes";
import mcpRouter from "./api/v1/ldai/mcp.routes";
import knowledgeRouter from "./api/v1/ldai/knowledge.routes";

app.use("/api/v1/storyfinder", projectsRouter);
app.use("/api/v1/storyfinder", candidatesRouter);
app.use("/api/v1/ldai", ldaiRouter);
app.use("/api/v1/ldai", mcpRouter);
app.use("/api/v1/ldai", knowledgeRouter);

// basic error guard (so failures don’t drop the socket silently)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: String(err?.message || err) });
});

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => console.log(`✅ Backend http://localhost:${PORT}`));
