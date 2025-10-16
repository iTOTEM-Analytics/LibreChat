import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function DeleteConfirmCandidateDataModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => { if (open) setValue(""); }, [open]);

  if (!open) return null;

  const ok = value.trim().toUpperCase() === "DELETE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94vw] max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 bg-white/70 flex items-center justify-between">
          <div className="text-lg font-semibold">Confirm removal</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-4 space-y-4">
          <p className="text-sm text-slate-700">
            This will remove all current candidate data for this project.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type <span className="font-semibold">DELETE</span> to confirm
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="DELETE"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-white/70 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!ok}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-gray-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
