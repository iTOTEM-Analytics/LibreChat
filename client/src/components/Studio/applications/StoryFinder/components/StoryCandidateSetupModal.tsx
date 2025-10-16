import { useEffect, useMemo, useRef, useState } from "react";
import { X, UploadCloud, ChevronRight, Check, Info, ChevronDown, CirclePlus, HelpCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { detectVendorColumn, detectCityProvinceColumns } from "../services/vendorDetect";

type ParsedTable = { rows: any[]; columns: string[]; sourceLabel: string };

const MAX_VENDORS = 500;
const DEFAULT_LIMIT = 5;

export default function StoryCandidateSetupModal({
  open,
  onClose,
  onStart,
  defaultProject,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (payload: {
    vendors: string[];
    instruction: string;
    sourceLabel: string;
    limit: number;
    preferRecent: boolean;
    focus: "innovation" | "sustainability" | "growth";
    locationTarget?: string;
    criteriaMode?: "auto" | "public";
    meta?: { 
      sourceMode: "upload" | "existing" | "manual"; 
      vendorCol?: string; 
      cityCol?: string; 
      provinceCol?: string;
      manual?: { name: string; location?: string }[];
    };
    rows?: Record<string, any>[];
  }) => void;
  defaultProject: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [detectedCol, setDetectedCol] = useState<string | null>(null);
  const [cityCol, setCityCol] = useState<string | null>(null);
  const [provinceCol, setProvinceCol] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [preferRecent, setPreferRecent] = useState(true);
  const [focus, setFocus] = useState<"innovation" | "sustainability" | "growth">("innovation");
  const [locationTarget, setLocationTarget] = useState("");
  const [connectedProject, setConnectedProject] = useState(defaultProject);
  const [openProjectSelect, setOpenProjectSelect] = useState(false);
  const [openExistingFileSelect, setOpenExistingFileSelect] = useState(false);
  const [sourceMode, setSourceMode] = useState<"upload" | "existing" | "manual">("upload");
  const [selectedExistingFile, setSelectedExistingFile] = useState<{ label: string; url: string } | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [manualVendors, setManualVendors] = useState<{ name: string; location?: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [criteriaMode, setCriteriaMode] = useState<"auto" | "public">("auto");

  const projectOptions = Array.from(
    new Set([defaultProject || "", "SupplyChain North (2025-03-01)", "SC Ops West (2025-01-18)", "Vendor Audit Q4 (2024-12-12)", "Global SC Review (2024-09-30)"])
  ).filter(Boolean);

  const existingFilesMap: Record<string, { label: string; url: string }[]> = {
    [defaultProject || ""]: [{ label: "project_vendors.csv", url: "/data/demo_supplychain_vendors.csv" }, { label: "demo_supplychain_vendors.csv", url: "/data/demo_supplychain_vendors.csv" }],
    "SupplyChain North (2025-03-01)": [{ label: "north_vendors.csv", url: "/data/demo_supplychain_vendors.csv" }],
    "SC Ops West (2025-01-18)": [{ label: "sc_ops_west.txt", url: "/data/demo_supplychain_vendors.csv" }],
    "Vendor Audit Q4 (2024-12-12)": [{ label: "vendor_audit_q4.csv", url: "/data/demo_supplychain_vendors.csv" }],
    "Global SC Review (2024-09-30)": [{ label: "global_review.xlsx", url: "/data/demo_supplychain_vendors.csv" }],
  };

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTable(null);
    setDetectedCol(null);
    setCityCol(null);
    setProvinceCol(null);
    setInstruction("");
    setLimit(DEFAULT_LIMIT);
    setPreferRecent(true);
    setFocus("innovation");
    setLocationTarget("");
    setConnectedProject(defaultProject);
    setSourceMode("upload");
    setSelectedExistingFile(null);
    setOpenProjectSelect(false);
    setOpenExistingFileSelect(false);
    setManualVendors([]);
    setShowAdd(false);
    setNewName("");
    setNewLoc("");
    setCriteriaMode("auto");
  }, [open, defaultProject]);

  const suggestedVendor = useMemo(() => (table ? detectVendorColumn(table.columns) : null), [table]);
  const suggestedLoc = useMemo(() => (table ? detectCityProvinceColumns(table.columns) : { city: null, province: null }), [table]);

  useEffect(() => {
    setDetectedCol(suggestedVendor ?? null);
    setCityCol(suggestedLoc.city ?? null);
    setProvinceCol(suggestedLoc.province ?? null);
  }, [suggestedVendor, suggestedLoc]);

  if (!open) return null;

  const haveTable = !!table;
  const haveManual = sourceMode === "manual" && manualVendors.length > 0;
  const canNext = haveTable || haveManual;
  const canStart = sourceMode === "manual" ? haveManual : !!detectedCol;

  async function parseCsvText(text: string, label: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.length);
    if (!lines.length) return;
    const header = lines[0].split(",").map((s) => s.trim());
    const rows = lines.slice(1).map((ln) => {
      const parts = ln.split(",");
      const obj: any = {};
      header.forEach((h, i) => (obj[h] = (parts[i] ?? "").trim()));
      return obj;
    });
    setTable({ rows, columns: header, sourceLabel: label });
  }
  async function parseCsvFromUrl(url: string, label: string) {
    const res = await fetch(url);
    const text = await res.text();
    await parseCsvText(text, label);
  }
  async function parseExcelFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    const columns = Object.keys(rows[0] ?? {});
    setTable({ rows, columns, sourceLabel: file.name });
  }
  const handleLocalFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      await parseCsvText(await file.text(), file.name);
      return;
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xlsm") || name.endsWith(".xls")) {
      await parseExcelFile(file);
      return;
    }
    alert("Unsupported file type. Use CSV, XLSX, XLSM, or TXT.");
  };

  const Status = ({ suggested, selected }: { suggested?: string | null; selected?: string | null }) => {
    if (selected) return <span className="text-xs text-gray-600">Selection: {selected}</span>;
    if (suggested) return <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Check className="w-3.5 h-3.5 text-teal-600" /> Detected: {suggested}</span>;
    return <span className="text-xs text-gray-500">No match</span>;
  };

  const SourcePickers = (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white mb-4">
      <div className="p-6 space-y-5">
        <div className="text-sm font-medium">Choose your source</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setSourceMode("upload")}
            className={`rounded-xl px-3 py-2.5 text-sm ring-1 transition ${sourceMode === "upload" ? "bg-teal-800 text-white ring-transparent" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
            Upload File
          </button>
          <button onClick={() => setSourceMode("existing")}
            className={`rounded-xl px-3 py-2.5 text-sm ring-1 transition ${sourceMode === "existing" ? "bg-teal-800 text-white ring-transparent" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
            Project Files (incl. Demo)
          </button>
          <button onClick={() => { setSourceMode("manual"); setCriteriaMode("public"); }}
            className={`rounded-xl px-3 py-2.5 text-sm ring-1 transition ${sourceMode === "manual" ? "bg-teal-800 text-white ring-transparent" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
            Manual Vendor List
          </button>
        </div>

        {sourceMode === "upload" && (
          <div className="rounded-xl ring-1 ring-slate-200 bg-white min-h-56 flex items-center">
            <div className="w-full p-6">
              <div className="w-full min-h-[180px] rounded-2xl border-2 border-dashed cursor-pointer bg-slate-50/60 border-slate-300 hover:border-teal-600 transition flex flex-col items-center justify-center text-center px-6 py-8 overflow-x-hidden"
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => { e.preventDefault(); handleLocalFiles(e.dataTransfer.files); }}
                   role="button" tabIndex={0}
                   onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") uploadInputRef.current?.click(); }}
                   onClick={() => uploadInputRef.current?.click()}>
                <div className="mb-2 inline-flex items-center justify-center rounded-full bg-teal-50 p-3 ring-1 ring-teal-100">
                  <UploadCloud className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-slate-700 text-sm">Drag and drop your file</p>
                <p className="text-xs text-slate-500 mb-3">CSV, TXT, XLSX, XLSM</p>
                <input ref={uploadInputRef} type="file" accept=".csv,.txt,.xlsx,.xlsm,.xls" className="hidden"
                  onChange={(e) => { const input = e.currentTarget; const files = input.files; if (!files || !files.length) return;
                    handleLocalFiles(files).then(() => { input.value = ""; }); }} />
              </div>
            </div>
          </div>
        )}

        {sourceMode === "existing" && (
          <div className="rounded-xl ring-1 ring-slate-200 bg-white min-h-56 flex items-center">
            <div className="w-full p-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">Select a file</label>
              <div className="relative">
                <button type="button" onClick={() => setOpenExistingFileSelect((v) => !v)}
                  className="w-full text-left cursor-pointer rounded-xl border-0 ring-1 ring-slate-200 bg-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                  {selectedExistingFile?.label || "Choose a project file…"}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </button>
                {openExistingFileSelect && (
                  <div className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <ul className="py-1">
                        {([{ label: "demo_supplychain_vendors.csv", url: "/data/demo_supplychain_vendors.csv" }] as const)
                          .concat(existingFilesMap[connectedProject] || [])
                          .reduce<{ label: string; url: string }[]>((acc, f) => {
                            const seen = acc.some((x) => x.label === f.label && x.url === f.url);
                            return seen ? acc : acc.concat(f as any);
                          }, [])
                          .map((f, idx) => (
                            <li key={idx} onClick={async () => { setSelectedExistingFile(f); setOpenExistingFileSelect(false); await parseCsvFromUrl(f.url, f.label); }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${selectedExistingFile?.url === f.url ? "text-slate-900 font-medium" : "text-slate-700"}`}>
                              {f.label}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {sourceMode === "manual" && (
          <div className="rounded-xl ring-1 ring-slate-200 bg-white h-56">
            <div className="p-6 flex flex-col gap-4 h-full">
              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-slate-200 hover:bg-slate-50"
                      onClick={() => setShowAdd((v) => !v)}>
                <CirclePlus className="w-4 h-4" /> Add Vendor
              </button>
              {showAdd && (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <input className="flex-1 rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                         placeholder="Vendor name" value={newName}
                         onChange={(e) => setNewName(e.target.value)} />
                  <input className="sm:w-72 rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                         placeholder="Location (optional)" value={newLoc}
                         onChange={(e) => setNewLoc(e.target.value)} />
                  <button className="rounded-xl px-3 py-2.5 text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300"
                          onClick={() => { if (!newName.trim()) return;
                            setManualVendors((v) => [...v, { name: newName.trim(), location: newLoc.trim() || undefined }]);
                            setNewName(""); setNewLoc(""); setShowAdd(false); }}>
                    Add
                  </button>
                </div>
              )}
              <div className="text-sm text-slate-700 grow overflow-y-auto pr-1">
                {manualVendors.length === 0 ? (<div className="text-xs text-slate-500">No vendors added.</div>) : (
                  <div className="space-y-1">
                    {manualVendors.map((v, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="truncate">{v.name}{v.location ? ` — ${v.location}` : ""}</div>
                        <button className="text-xs px-2 py-1 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"
                                onClick={() => setManualVendors((arr) => arr.filter((_, idx) => idx !== i))}>remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">At least one vendor is required to continue.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94vw] max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="text-lg font-semibold">Add Data</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200" aria-label="Close">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="px-6 pt-5 space-y-5 overflow-y-auto overflow-x-hidden flex-1">
          {step === 1 && (<>{/* Project + Source pickers */}<div>
              <label className="mb-3 block text-sm font-medium text-slate-700">Project</label>
              <div className="relative">
                <button type="button" onClick={() => setOpenProjectSelect((v) => !v)}
                        className="w-full text-left cursor-pointer rounded-xl border-0 ring-1 ring-slate-200 bg-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                  {connectedProject || "Select…"}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </button>
                {openProjectSelect && (
                  <div className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <ul className="py-1">
                        {projectOptions.map((opt, idx) => (
                          <li key={idx} onClick={() => { setConnectedProject(opt); setOpenProjectSelect(false); setSelectedExistingFile(null); }}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${connectedProject === opt ? "text-slate-900 font-medium" : "text-slate-700"}`}>
                            {opt || "Select…"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>{SourcePickers}</>)}

          {step === 2 && (
            <>
              {sourceMode !== "manual" && table && (
                <div className="rounded-xl ring-1 ring-slate-200 bg-white">
                  <div className="p-6 space-y-5">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Vendor column</div>
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center min-w-0">
                        <select value={detectedCol ?? ""} onChange={(e) => setDetectedCol(e.target.value)}
                                className="w-full sm:w-80 rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 min-w-0">
                          <option value="" disabled>Select a column</option>
                          {table.columns.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                        <Status suggested={suggestedVendor} selected={detectedCol} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="text-sm font-medium">City column</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <select value={cityCol ?? ""} onChange={(e) => setCityCol(e.target.value || null)}
                                  className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 min-w-0">
                            <option value="">None</option>
                            {table.columns.map((c) => (<option key={c} value={c}>{c}</option>))}
                          </select>
                          <Status suggested={suggestedLoc.city} selected={cityCol ?? undefined} />
                        </div>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <div className="text-sm font-medium">Province / State column</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <select value={provinceCol ?? ""} onChange={(e) => setProvinceCol(e.target.value || null)}
                                  className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 min-w-0">
                            <option value="">None</option>
                            {table.columns.map((c) => (<option key={c} value={c}>{c}</option>))}
                          </select>
                          <Status suggested={suggestedLoc.province} selected={provinceCol ?? undefined} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sourceMode === "manual" && (
                <div className="rounded-xl ring-1 ring-slate-200 bg-white">
                  <div className="p-6 space-y-2">
                    <div className="text-sm font-medium">Vendors</div>
                    {manualVendors.length === 0 ? (
                      <div className="text-xs text-slate-500">No vendors added.</div>
                    ) : (
                      <div className="text-sm text-slate-700 space-y-1">
                        {manualVendors.map((v, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="truncate">{v.name}{v.location ? ` — ${v.location}` : ""}</div>
                            <button className="text-xs px-2 py-1 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"
                                    onClick={() => setManualVendors((arr) => arr.filter((_, idx) => idx !== i))}>remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl ring-1 ring-slate-200 bg-white">
                <div className="p-6 grid gap-5 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-1">Candidates to find <Info className="w-3.5 h-3.5 text-gray-400" /></div>
                    <input type="range" min={1} max={5} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-full accent-teal-600" />
                    <div className="text-xs text-gray-600">Selected: {limit}</div>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <div className="text-sm font-medium">Narrative focus</div>
                    <select value={focus} onChange={(e) => setFocus(e.target.value as any)}
                            className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 min-w-0">
                      <option value="innovation">Innovation</option>
                      <option value="sustainability">Sustainability</option>
                      <option value="growth">Growth</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Prefer recent news</div>
                    <button onClick={() => setPreferRecent((v) => !v)}
                            className={`w-full rounded-xl px-3 py-2.5 text-sm ring-1 transition ${preferRecent ? "bg-teal-600 text-white ring-transparent" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
                      {preferRecent ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl ring-1 ring-slate-200 bg-white">
                <div className="p-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Location target (bias/limit)</div>
                    <input value={locationTarget} onChange={(e) => setLocationTarget(e.target.value)} placeholder="e.g., Vancouver, BC"
                           className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Candidate criteria
                      <div className="relative group">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <div className="invisible group-hover:visible absolute z-50 mt-2 w-64 rounded-lg px-3 py-2 text-xs text-white bg-slate-500 shadow">
                          Auto-detect uses dataset parameters. Public criteria uses vendor name and public info.
                        </div>
                      </div>
                    </div>
                    <button onClick={() => sourceMode !== "manual" && setCriteriaMode((m) => (m === "auto" ? "public" : "auto"))}
                            className={`w-full rounded-2xl px-3 py-2.5 text-sm ring-1 transition ${criteriaMode === "auto" ? "bg-teal-600 text-white ring-transparent" : "bg-white ring-slate-200"} ${sourceMode === "manual" ? "opacity-60 cursor-not-allowed" : ""}`}>
                      {criteriaMode === "auto" ? "Auto-detect from dataset" : "Public information criteria"}
                    </button>
                    {sourceMode === "manual" && <div className="text-xs text-slate-500">Locked to public criteria for manual list.</div>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl ring-1 ring-slate-200 bg-white mb-4">
                <div className="p-6 space-y-2">
                  <div className="text-sm font-medium">Custom Instruction</div>
                  <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)}
                            placeholder="e.g., prioritize vendors with recent milestones and sustainability narratives"
                            className="w-full min-h-28 rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-white">
          {step === 1 ? (
            <div className="flex justify-end">
              <button onClick={() => canNext && setStep(2)} disabled={!canNext}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Source: {sourceMode === "manual" ? "manual" : table?.sourceLabel ?? "—"}</div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                        className="px-4 py-2 rounded-xl ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50">Back</button>
                <button disabled={!canStart}
                        onClick={() => {
                          const vendors = sourceMode === "manual"
                            ? manualVendors.map((v) => (v.location ? `${v.name} | ${v.location}` : v.name))
                            : table!.rows.map((r) => (r[detectedCol!] ?? "").toString().trim()).filter((v) => v.length > 0).slice(0, MAX_VENDORS);

                          if (sourceMode === "manual") {
                            console.log("🚀 Starting manual vendor search with:", {
                              vendors: manualVendors,
                              count: manualVendors.length,
                              instruction,
                              limit,
                              focus
                            });
                          }

                          onStart({
                            vendors,
                            instruction,
                            sourceLabel: sourceMode === "manual" ? "manual" : table!.sourceLabel,
                            limit,
                            preferRecent,
                            focus,
                            locationTarget: locationTarget.trim() || undefined,
                            criteriaMode: sourceMode === "manual" ? "public" : criteriaMode,
                            meta: sourceMode === "manual" ? { 
                              sourceMode,
                              manual: manualVendors // Send the actual manual vendors array
                            } : {
                              sourceMode,
                              vendorCol: detectedCol ?? undefined,
                              cityCol: cityCol ?? undefined,
                              provinceCol: provinceCol ?? undefined,
                            },
                            rows: sourceMode === "manual" ? undefined : table?.rows || [],
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:bg-gray-300">
                  Find Story Candidates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
