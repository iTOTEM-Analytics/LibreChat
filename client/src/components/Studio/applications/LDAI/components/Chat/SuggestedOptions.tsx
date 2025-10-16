// frontend/src/applications/LDAI/components/Chat/SuggestedOptions.tsx
import { useMemo, useRef, useState } from "react";
import { useChatStore } from "./useChatStore";

export default function SuggestedOptions({ refId, onPick }: { refId?: string; onPick: (t: string) => void }) {
  const data = useChatStore((s) => (refId ? s.suggestionsByRef[refId] : undefined));
  const optionType = data?.option_type || "buttons";
  const opts = data?.options || [];
  const schema = data?.schema || {};
  const [range, setRange] = useState<number>(schema.min ?? 0);
  const [sel, setSel] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const disabled = !data;
  if (!data || disabled) return null;

  const send = (msg: string) => onPick(msg);

  const commonBox = "mt-2 w-full flex flex-wrap gap-2";

  switch (optionType) {
    case "buttons":
      return (
        <div className={commonBox}>
          {opts.slice(0, 5).map((o, i) => (
            <button
              key={i}
              className="px-3 py-2 border border-teal-700 text-slate-700 rounded-md hover:bg-teal-50"
              onClick={() => send(o)}
            >
              {o}
            </button>
          ))}
        </div>
      );
    case "select":
      return (
        <div className={commonBox}>
          {opts.map((o) => {
            const active = sel.includes(o);
            return (
              <button
                key={o}
                className={`px-3 py-2 rounded-md border ${active ? "border-teal-700 bg-teal-50" : "border-teal-700 text-slate-700 hover:bg-teal-50"}`}
                onClick={() => {
                  if (schema.select_multiple) {
                    setSel((old) => (old.includes(o) ? old.filter((x) => x !== o) : [...old, o]));
                  } else {
                    setSel([o]);
                    send(o);
                  }
                }}
              >
                {o}
              </button>
            );
          })}
          {schema.select_multiple && sel.length > 0 && (
            <button
              className="px-3 py-2 rounded-md bg-teal-700 text-white"
              onClick={() => send(sel.join(", "))}
            >
              Apply
            </button>
          )}
        </div>
      );
    case "range":
      return (
        <div className="mt-2 w-full">
          <input
            type="range"
            min={schema.min ?? 0}
            max={schema.max ?? 100}
            step={schema.step ?? 1}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 text-xs text-gray-600">Value: {range}</div>
          <div className="mt-2">
            <button className="px-3 py-2 rounded-md bg-teal-700 text-white" onClick={() => send(String(range))}>
              Use {range}
            </button>
          </div>
        </div>
      );
    case "date":
    case "datetime":
    case "year":
      return (
        <div className={commonBox}>
          <input
            ref={inputRef}
            type={optionType === "datetime" ? "datetime-local" : "date"}
            min={schema.date_min}
            max={schema.date_max}
            className="px-2 py-1 border border-teal-700 rounded-md"
          />
          <button
            className="px-3 py-2 rounded-md bg-teal-700 text-white"
            onClick={() => inputRef.current && send(inputRef.current.value)}
          >
            Set
          </button>
        </div>
      );
    case "toggle":
      return (
        <div className={commonBox}>
          <button className="px-3 py-2 rounded-md border border-teal-700 text-slate-700 hover:bg-teal-50" onClick={() => send("Yes")}>
            Yes
          </button>
          <button className="px-3 py-2 rounded-md border border-teal-700 text-slate-700 hover:bg-teal-50" onClick={() => send("No")}>
            No
          </button>
        </div>
      );
    case "input":
      return null; // main input only
    default:
      return null;
  }
}
