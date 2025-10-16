import { useState, useEffect } from "react";
import { X, WandSparkles, Loader2, Settings } from "lucide-react";

type GenerationSettings = {
  storyLength: "short" | "medium" | "long";
  tone: "professional" | "casual" | "creative";
  focus: "innovation" | "sustainability" | "growth" | "all";
  includeMetrics: boolean;
};

export default function GenerateAllConfirmationModal({
  open,
  onClose,
  onConfirm,
  candidatesCount,
  quotaRemaining,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (settings: GenerationSettings) => void;
  candidatesCount: number;
  quotaRemaining: number;
}) {
  const [settings, setSettings] = useState<GenerationSettings>({
    storyLength: "medium",
    tone: "professional",
    focus: "all",
    includeMetrics: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsGenerating(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      await onConfirm(settings);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94vw] max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 bg-white/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-teal-100">
              <WandSparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">Generate Stories for All Candidates</div>
              <div className="text-sm text-slate-600">{candidatesCount} candidates will be processed</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 transition-colors" 
            aria-label="Close"
            disabled={isGenerating}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-4 space-y-6">
          {/* Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Settings className="w-4 h-4" />
              Generation Settings
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Story Length
                </label>
                <select
                  value={settings.storyLength}
                  onChange={(e) => setSettings(prev => ({ ...prev, storyLength: e.target.value as any }))}
                  className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  disabled={isGenerating}
                >
                  <option value="short">Short (150-200 words)</option>
                  <option value="medium">Medium (300-400 words)</option>
                  <option value="long">Long (500-600 words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tone
                </label>
                <select
                  value={settings.tone}
                  onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value as any }))}
                  className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  disabled={isGenerating}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Focus Area
              </label>
              <select
                value={settings.focus}
                onChange={(e) => setSettings(prev => ({ ...prev, focus: e.target.value as any }))}
                className="w-full rounded-xl border-0 ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                disabled={isGenerating}
              >
                <option value="all">All areas</option>
                <option value="innovation">Innovation</option>
                <option value="sustainability">Sustainability</option>
                <option value="growth">Growth</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeMetrics"
                checked={settings.includeMetrics}
                onChange={(e) => setSettings(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                disabled={isGenerating}
              />
              <label htmlFor="includeMetrics" className="text-sm text-slate-700">
                Include performance metrics and KPIs in stories
              </label>
            </div>
          </div>

          {/* Quota Check */}
          {quotaRemaining < candidatesCount && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-red-100">
                  <WandSparkles className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">Insufficient Quota</div>
                  <div>You need {candidatesCount} quota to generate stories for all candidates, but only have {quotaRemaining} remaining.</div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          <div className={`p-4 rounded-xl border ${
            quotaRemaining < candidatesCount 
              ? 'bg-gray-50 border-gray-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${
                quotaRemaining < candidatesCount 
                  ? 'bg-gray-100' 
                  : 'bg-amber-100'
              }`}>
                <WandSparkles className={`w-4 h-4 ${
                  quotaRemaining < candidatesCount 
                    ? 'text-gray-600' 
                    : 'text-amber-600'
                }`} />
              </div>
              <div className={`text-sm ${
                quotaRemaining < candidatesCount 
                  ? 'text-gray-700' 
                  : 'text-amber-800'
              }`}>
                <div className="font-medium mb-1">
                  {quotaRemaining < candidatesCount 
                    ? 'Cannot Generate Stories' 
                    : 'Ready to generate stories?'
                  }
                </div>
                <div>
                  {quotaRemaining < candidatesCount 
                    ? `You need ${candidatesCount - quotaRemaining} more quota to proceed.`
                    : `This will create stories for all ${candidatesCount} candidates using the selected settings. The process may take a few minutes.`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-white/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl ring-1 ring-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isGenerating || quotaRemaining < candidatesCount}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white shadow-sm hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <WandSparkles className="w-4 h-4" />
                Generate All Stories
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
