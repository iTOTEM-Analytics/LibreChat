import { StartRunBody } from "./types";

export function assertStartRunBody(x: any): asserts x is StartRunBody {
  if (!x || typeof x !== "object") throw new Error("Invalid body");
  if (!x.projectId || typeof x.projectId !== "string") throw new Error("projectId required");
  if (!x.source || typeof x.source !== "object") throw new Error("source required");
  if (!["upload", "existing", "manual"].includes(x.source.mode)) throw new Error("source.mode invalid");
  if (typeof x.limit !== "number" || x.limit < 1) throw new Error("limit invalid");
  if (!["innovation", "sustainability", "growth"].includes(x.focus)) throw new Error("focus invalid");
}
