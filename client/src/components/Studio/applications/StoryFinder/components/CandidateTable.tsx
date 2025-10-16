import { Info, WandSparkles, Trash } from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  location?: string;
  score: number | undefined;
  description?: string;
  generateStory?: string | number | 'Not generated';
};

interface CandidateTableProps {
  candidates: Candidate[];
  loading?: boolean;
  running?: boolean;
  quotaRemaining?: number;
  onViewCandidate: (id: string) => void;
  onGenerateAll?: () => void;
  onDeleteAll?: () => void;
}

export default function CandidateTable({
  candidates,
  loading = false,
  running = false,
  quotaRemaining = 10,
  onViewCandidate,
  onGenerateAll,
  onDeleteAll,
}: CandidateTableProps) {
  const pulseStyle = { animation: 'pulseSlow 2.4s ease-in-out infinite' } as const;
  const canGenerateAll = quotaRemaining >= candidates.length;

  return (
    <section className="rounded-2xl bg-white/90 ring-1 ring-slate-200 shadow-sm">
      <style>{`@keyframes pulseSlow {0%,100%{opacity:1} 50%{opacity:.45}}`}</style>

      <div className="p-5 border-b border-slate-200/70 flex items-center justify-between">
        <div className="font-medium">Story Candidates</div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info className="w-4 h-4" /> {candidates.length} found
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50/70 text-gray-600">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Location</th>
              <th className="text-left px-5 py-3">Score</th>
              <th className="text-left px-5 py-3">Description</th>
              <th className="text-left px-5 py-3">Number of Stories</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>

          {running && (
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i} style={pulseStyle}>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-gray-200 rounded w-40" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-gray-200 rounded w-12" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-gray-200 rounded w-64" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-8 bg-gray-200 rounded w-28" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-8 bg-gray-200 rounded w-28" />
                  </td>
                </tr>
              ))}
            </tbody>
          )}

          {!running && (
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Add data to generate the list of story candidate vendors.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-slate-200/70">
                    <td className="px-5 py-3">
                      <button
                        className="text-teal-800 hover:underline"
                        onClick={() => onViewCandidate(candidate.id)}
                      >
                        {candidate.name}
                      </button>
                    </td>
                    <td className="px-5 py-3">{candidate.location || '—'}</td>
                    <td className="px-5 py-3">
                      {typeof candidate.score === 'number' ? candidate.score : '—'}
                    </td>
                    <td className="px-5 py-3">{candidate.description || '—'}</td>
                    <td className="px-5 py-3">{candidate.generateStory || 'Not generated'}</td>
                    <td className="px-5 py-3">
                      <button
                        className="px-2 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                        onClick={() => onViewCandidate(candidate.id)}
                      >
                        View Candidate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>

      {candidates.length > 0 && !running && (
        <div className="flex justify-between border-t border-slate-200">
          <div className="p-4 flex">
            <button
              className="px-3 py-1.5 rounded-lg ring-1 ring-slate-300 text-sm bg-white text-slate-600 hover:bg-slate-50"
              onClick={onDeleteAll}
            >
              <div className="flex items-center gap-2">
                <Trash className="w-4 h-4" /> Remove all data
              </div>
            </button>
          </div>
          <div className="p-4 flex">
            <button
              className={`px-3 py-1.5 rounded-lg ring-1 ring-slate-300 text-sm ${
                canGenerateAll
                  ? 'bg-white text-slate-700 hover:bg-teal-700 hover:text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={onGenerateAll}
              disabled={!canGenerateAll}
            >
              <div className="flex items-center gap-2">
                <WandSparkles className="w-4 h-4" />
                Generate for all
                {!canGenerateAll && <span className="text-xs">(Insufficient quota)</span>}
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
