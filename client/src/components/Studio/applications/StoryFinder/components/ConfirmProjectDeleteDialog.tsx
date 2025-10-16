export default function ConfirmDialog({
  title,
  body,
  confirmText = "Confirm",
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string; // pass the project name here
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[92vw] max-w-md rounded-2xl bg-gray-50 shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-white/70">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>

        <div className="px-6 py-5 text-sm text-slate-700">
          The following project will be deleted permanently:{" "}
          <div className="font-bold mt-2 text-slate-900">“{body}”</div>
        </div>

        <div className="px-6 py-4 bg-white/70 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white shadow-sm hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
