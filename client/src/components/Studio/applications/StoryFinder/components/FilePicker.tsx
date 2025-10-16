import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function FilePicker({ onParsed }: { onParsed: (rows: any[], columns: string[], label: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  const parse = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rows = (parsed.data as any[]).filter(Boolean);
      const columns = parsed.meta.fields ?? Object.keys(rows[0] ?? {});
      onParsed(rows, columns, file.name);
      return;
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const columns = Object.keys(rows[0] ?? {});
      onParsed(rows, columns, file.name);
      return;
    }
    alert("Unsupported file type. Use CSV, XLSX, or TXT.");
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-sm text-center transition ${drag ? "bg-gray-50" : "bg-white"}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0]; if (f) parse(f);
      }}
    >
      <div className="mb-2 text-gray-600">Drag & drop file here</div>
      <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" onClick={() => inputRef.current?.click()}>
        Browse…
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) parse(f); }}
      />
    </div>
  );
}
