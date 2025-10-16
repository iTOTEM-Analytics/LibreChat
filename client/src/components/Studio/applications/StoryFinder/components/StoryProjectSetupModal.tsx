import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";

type Init = {
  id?: string;
  name?: string;
  connectedProject?: string;
  description?: string;
};

export default function StoryProjectModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (p: { name: string; connectedProject: string; description: string }) => void;
  onUpdate: (p: { id: string; name: string; connectedProject: string; description: string }) => void;
  initial?: Init;
}) {
  const [name, setName] = useState("");
  const [connectedProject, setConnectedProject] = useState("");
  const [description, setDescription] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [openSelect, setOpenSelect] = useState(false);

  const isEdit = !!initial?.id;
  const options = [
    "",
    "SupplyChain North (2025-03-01)",
    "SC Ops West (2025-01-18)",
    "Vendor Audit Q4 (2024-12-12)",
    "Global SC Review (2024-09-30)",
    "Project Eagle (2024-08-12)",
    "Logistics Sync (2024-06-30)",
    "Supplier Intake (2024-05-10)",
  ];

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setConnectedProject(initial?.connectedProject || "");
      setDescription(initial?.description || "");
      setOpenSelect(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94vw] max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-white/70 flex items-center justify-between">
          <div className="text-lg font-semibold">{isEdit ? "Edit Story Project" : "New Story Project"}</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200" aria-label="Close">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-5 space-y-5">
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vendor Stories – West Region"
              className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <p className="mt-1 text-xs text-slate-500">Max 50 chars shown on the card.</p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Connect to Project</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenSelect((v) => !v)}
                className="w-full text-left cursor-pointer rounded-xl border-0 ring-1 ring-slate-200 bg-white px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {connectedProject || "Select…"}
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </button>

              {openSelect && (
                <div className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
                  <div className="max-h-40 overflow-y-scroll">
                    <ul className="py-1">
                      {options.map((opt, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setConnectedProject(opt);
                            setOpenSelect(false);
                          }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${
                            connectedProject === opt ? "text-slate-900 font-medium" : "text-slate-700"
                          }`}
                        >
                          {opt || "Select…"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Description</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
                placeholder="Short context for this story project…"
                maxLength={1500}
                className="w-full min-h-28 rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="pointer-events-none absolute right-3 top-2 text-[11px] leading-none text-slate-400">
                {description.length}/1500
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          <div
            className="relative"
            onMouseEnter={() => !canSubmit && setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            {!canSubmit && showTip && (
              <div className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-700 px-3 py-1.5 text-xs text-white shadow">
                Enter a project name
              </div>
            )}
            <button
              disabled={!canSubmit}
              title={!canSubmit ? "Enter a project name" : ""}
              onClick={() => {
                const payload = {
                  name: name.trim(),
                  connectedProject,
                  description: description.trim(),
                };
                if (isEdit && initial?.id) {
                  onUpdate({ id: initial.id, ...payload });
                } else {
                  onCreate(payload);
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white shadow-sm hover:bg-teal-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 disabled:shadow-none"
            >
              {isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
