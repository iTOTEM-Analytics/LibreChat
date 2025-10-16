export function pickColumn(obj: Record<string,string>, names: string[]) {
    const keys = Object.keys(obj);
    const norm = (s:string)=>s.toLowerCase().replace(/\s|_/g,"");
    for (const want of names) {
      const w = norm(want);
      const hit = keys.find(k => norm(k).includes(w));
      if (hit) return hit;
    }
    return null;
  }
  
  export function toNumberMaybe(v:any): number | null {
    if (v === null || v === undefined) return null;
    const n = Number(String(v).replace(/[^0-9.\-]/g,""));
    return Number.isFinite(n) ? n : null;
  }
  
  export function quantiles(arr: number[]) {
    const a = [...arr].sort((x,y)=>x-y);
    if (a.length === 0) return { q1:0, q2:0, q3:0, mean:0 };
    const q = (p:number)=> a[Math.max(0, Math.min(a.length-1, Math.floor((a.length-1)*p)))];
    const mean = a.reduce((s,n)=>s+n,0)/a.length;
    return { q1:q(0.25), q2:q(0.5), q3:q(0.75), mean };
  }
  
  export function parseLocationBias(loc?: string) {
    if (!loc) return { city:null, province:null };
    const parts = loc.split(",").map(s=>s.trim()).filter(Boolean);
    if (parts.length >= 2) return { city: parts[0], province: parts[1] };
    return { city: null, province: parts[0] || null };
  }
  
  export function cmp(a:boolean,b:boolean){ return Number(b)-Number(a); } // true first
  
  export function biasSortFactory(biasProvince?: string|null, biasCity?: string|null) {
    const bp = biasProvince?.toLowerCase() || null;
    const bc = biasCity?.toLowerCase() || null;
    return (r1: any, r2: any) => {
      const p1 = (r1.province||"").toLowerCase() === (bp||"");
      const p2 = (r2.province||"").toLowerCase() === (bp||"");
      if (p1!==p2) return cmp(p1,p2);
      const c1 = bc ? ((r1.city||"").toLowerCase().startsWith(bc)) : false;
      const c2 = bc ? ((r2.city||"").toLowerCase().startsWith(bc)) : false;
      if (c1!==c2) return cmp(c1,c2);
      return 0;
    };
  }
  