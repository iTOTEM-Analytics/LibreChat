import { Loader2 } from 'lucide-react';

interface Stage {
  label: string;
  done: boolean;
}

interface DiscoveryProgressProps {
  stages: Stage[];
  running: boolean;
  onStop?: () => void;
  onClose?: () => void;
}

export default function DiscoveryProgress({
  stages,
  running,
  onStop,
  onClose,
}: DiscoveryProgressProps) {
  if (!running && !stages.some((s) => s.done)) {
    return null;
  }

  const progress = Math.round(
    (stages.filter((s) => s.done).length / Math.max(stages.length, 1)) * 100,
  );

  return (
    <section className="rounded-2xl bg-white/90 ring-1 ring-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Candidate Discovery</div>
        <div className="flex items-center gap-2">
          {running && onStop && (
            <button className="text-sm text-red-600 hover:text-red-700" onClick={onStop}>
              Stop
            </button>
          )}
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={running}
          >
            ✕ Close
          </button>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-teal-700 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="space-y-2 text-sm">
        {stages.map((stage, i) => (
          <li key={i} className="flex items-center gap-2">
            {stage.done ? (
              <span className="inline-block w-4 h-4 rounded-full bg-teal-600" />
            ) : running ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <span className="inline-block w-4 h-4 rounded-full ring-1 ring-slate-300" />
            )}
            <span>{stage.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
