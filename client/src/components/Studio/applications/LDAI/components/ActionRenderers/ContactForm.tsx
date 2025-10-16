 // frontend/src/applications/LDAI/components/ActionRenderers/ContactForm.tsx
export default function ContactForm({ fields, submitUrl }: { fields: Array<any>; submitUrl?: string }) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); alert("Submitted (stub)"); }} className="space-y-2">
        {fields.map((f: any, i: number) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">{f.label || f.name}</label>
            {f.type === "textarea" ? (
              <textarea className="border rounded p-2 text-sm" required={!!f.required} />
            ) : (
              <input className="border rounded p-2 text-sm" type={f.type || "text"} required={!!f.required} />
            )}
          </div>
        ))}
        <button className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs">
          {submitUrl ? "Submit" : "Submit (local stub)"}
        </button>
      </form>
    );
  }
  