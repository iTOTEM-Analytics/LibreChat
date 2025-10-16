// frontend/src/applications/LDAI/components/ActionRenderers/BarChart.tsx
const COLORS = [
  "rgb(36, 123, 160)", // muted teal-blue
  "rgb(112, 193, 179)", // soft aqua
  "rgb(67, 170, 139)",  // teal-green hint
  "rgb(52, 152, 219)",  // formal blue-teal
  "rgb(41, 128, 185)",  // deep blue
  "rgb(22, 103, 137)",  // dark teal
];



export default function BarChart({
  x,
  y,
  title,
}: { x: (string | number)[]; y: number[]; title?: string }) {
  const max = Math.max(1, ...y);
  return (
    <div>
      {title && <div className="mb-2 text-gray-600">{title}</div>}
      <div className="space-y-1">
        {y.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-24 text-[11px] text-gray-500 truncate">
              {String(x[i] ?? i)}
            </div>
            <div className="flex-1 h-2 bg-gray-100 rounded">
              <div
                className="h-2 rounded"
                style={{
                  width: `${(v / max) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <div className="w-10 text-right text-[11px] text-gray-600">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
