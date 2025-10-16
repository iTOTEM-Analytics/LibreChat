import fs from "fs/promises";
import path from "path";
import {
  Client,
} from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

type StdioReg = { name:string; transport:"stdio"; command:string; args?:string[]; cwd?:string; env?:Record<string,string>; };
type TcpReg   = { name:string; transport:"tcp"; host:string; port:number; };
type RegistryItem = StdioReg | TcpReg;

const ENV_REG   = process.env.LDAI_MCP_REGISTRY;
const REG_PATH  = ENV_REG || path.join(__dirname, "data", "servers.local.json");
const DEBUG     = process.env.LDAI_MCP_DEBUG === "1";

const log = (...a:any[]) => { if (DEBUG) console.log("[MCP]", ...a); };

let registry: RegistryItem[] | null = null;
async function loadRegistry(): Promise<RegistryItem[]> {
  if (registry) return registry;
  const raw = await fs.readFile(REG_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Registry JSON must be an array");
  registry = parsed;
  return registry!;
}

class SdkClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private initPromise: Promise<void> | null = null;
  private seq: Promise<any> = Promise.resolve();

  constructor(private reg: StdioReg) {}

  private enqueue<T>(fn:()=>Promise<T>): Promise<T> {
    const run = async () => fn();
    const p = this.seq.then(run, run);
    this.seq = p.catch(()=>{});
    return p;
  }

  async initialize(){
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.enqueue(async () => {
      const { command, args = [], cwd, env } = this.reg;
      this.transport = new StdioClientTransport({
        command, args, cwd,
        env: { ...process.env, ...(env||{}), PYTHONUNBUFFERED:"1" },
      });
      this.client = new Client({ name:"ldai-backend", version:"0.1" }, { capabilities:{} });
      await this.client.connect(this.transport);
      log("connected:", (this.reg as any).name);
    });
    return this.initPromise;
  }

  async listToolDefs(){
    await this.initialize();
    const resp = await this.enqueue(() =>
      this.client!.request({ method:"tools/list" }, ListToolsResultSchema)
    );
    return resp.tools;
  }

  async listToolNames(): Promise<string[]> {
    const defs = await this.listToolDefs();
    return defs.map(t => t.name).filter(Boolean);
  }

  async toolsCall(name:string, args:any){
    await this.initialize();
    const result = await this.enqueue(() =>
      this.client!.request(
        { method:"tools/call", params:{ name, arguments: args || {} } },
        CallToolResultSchema
      )
    );
    return result;
  }

  get rawClient(){ return this.client!; }
}

const clients = new Map<string, SdkClient>();
async function getClient(name:string){
  const regs = await loadRegistry();
  const reg = regs.find((r:any)=>r.name===name);
  if (!reg) throw new Error(`server not found: ${name}`);
  if (reg.transport !== "stdio") throw new Error("only stdio transport supported");
  if (clients.has(name)) return clients.get(name)!;
  const c = new SdkClient(reg as StdioReg);
  clients.set(name, c);
  return c;
}

export async function listAllTools(){
  const regs = await loadRegistry();
  const out:any[] = [];
  for (const r of regs) {
    const name = (r as any).name;
    try {
      const c = await getClient(name);
      const tools = await c.listToolNames();
      out.push({ server:name, tools });
    } catch (e:any) {
      out.push({ server:name, tools:[], error:String(e?.message || e) });
    }
  }
  return out;
}

export async function listAllToolDefs(){
  const regs = await loadRegistry();
  const out:any[] = [];
  for (const r of regs) {
    const name = (r as any).name;
    try {
      const c = await getClient(name);
      const defs = await c.listToolDefs();
      out.push({ server:name, tools: defs });
    } catch (e:any) {
      out.push({ server:name, tools:[], error:String(e?.message || e) });
    }
  }
  return out;
}

function unwrapToolResult(result:any){
  if (result?.content && Array.isArray(result.content)) {
    for (const part of result.content) {
      if (part?.type === "text" && part.text != null) return part.text;
      if (part?.type === "json" && part.json != null) return part.json;
    }
  }
  return result;
}

export async function callTool(server:string, method:string, params?:any){
  const c = await getClient(server);
  const t0 = Date.now();
  if (process.env.LDAI_MCP_DEBUG === "1") {
    console.log("[MCP] tools/call →", { server, method, params });
  }
  try {
    const r = await c.toolsCall(method, params || {});
    const latency_ms = Date.now() - t0;
    const result = unwrapToolResult(r);
    return { result, latency_ms };
  } catch (e: any) {
    const latency_ms = Date.now() - t0;
    console.error(`[MCP] Tool call failed: ${server}.${method}`, {
      error: e?.message || e,
      params,
      server,
      method
    });
    
    // Provide more helpful error messages
    let errorMsg = e?.message || String(e);
    if (errorMsg.includes('validation error')) {
      errorMsg = `Parameter validation failed for ${server}.${method}. Please check required parameters.`;
    } else if (errorMsg.includes('missing')) {
      errorMsg = `Missing required parameters for ${server}.${method}. Please provide all required inputs.`;
    }
    
    throw new Error(errorMsg);
  }
}

export async function __debug(){
  const stat:any = {};
  try {
    const raw = await fs.readFile(REG_PATH, "utf-8");
    stat.reg_path  = REG_PATH;
    stat.reg_bytes = raw.length;
    stat.reg_names = JSON.parse(raw).map((x:any)=>x.name);
  } catch (e:any) {
    stat.error = e.message;
  }
  if (registry) stat.loaded_names = registry.map((r:any)=>r.name);
  return stat;
}
