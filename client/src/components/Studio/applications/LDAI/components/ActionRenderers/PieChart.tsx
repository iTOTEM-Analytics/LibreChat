 // frontend/src/applications/LDAI/components/ActionRenderers/PieChart.tsx
export default function PieChart({ labels, values, title }: { labels: (string|number)[]; values: number[]; title?: string }) {
    const total = values.reduce((s, v) => s + (v || 0), 0) || 1;
    return (
      <div>
        {title && <div className="mb-2 text-gray-600">{title}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative w-28 h-28 rounded-full" style={{
            background: `conic-gradient(${values.map((v, i) => `rgba(45, 212, 191, ${0.4 + 0.5*(i%2)}) ${(values.slice(0,i).reduce((s,c)=>s+(c||0),0)/total)*360}deg ${(values.slice(0,i+1).reduce((s,c)=>s+(c||0),0)/total)*360}deg`).join(", ")})`
          }} />
          <div className="text-xs text-gray-600 self-center">
            {values.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-500/70" />
                <span className="truncate">{String(labels[i] ?? i)}</span>
                <span className="ml-auto">{v}</span>
                <span className="text-[10px] text-gray-400">({Math.round((v/total)*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  