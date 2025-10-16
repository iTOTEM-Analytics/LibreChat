import { Compass, MessageSquareText, Info, MessageSquareDot, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';

const demos = [
  {
    name: 'LDAI (Local Data AI)',
    description: 'Agentic chat interface with regional intelligence',
    href: '/studio/ldai/admin',
    icon: MessageSquareDot,
    enabled: true,
  },
  {
    name: 'Story Finder',
    description: 'Insightful story generator',
    href: '/studio/storyfinder',
    icon: FileSearch,
    enabled: true,
  },
  {
    name: 'GeoScanner',
    description: 'Detect regional risks intelligently',
    href: '/studio/geoscanner',
    icon: Compass,
    enabled: false,
  },
  {
    name: 'Sentiment Analyzer',
    description: 'Analyze live sentiment feeds',
    href: '/studio/sentiment',
    icon: MessageSquareText,
    enabled: false,
  },
];

export default function StudioDashboard() {
  const navigate = useNavigate();
  const [_, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-slate-600 mb-12">Studio Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {demos.map((demo) => {
          const Icon = demo.icon;
          const isDisabled = !demo.enabled;

          return (
            <div
              key={demo.name}
              onClick={() => !isDisabled && navigate(demo.href)}
              onMouseEnter={() => setHovered(demo.name)}
              onMouseLeave={() => setHovered(null)}
              className={clsx(
                'relative rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out',
                isDisabled ? 'opacity-60 cursor-default' : 'cursor-pointer'
              )}
              style={{ minHeight: '200px' }}
            >
              {/* Status dot and label */}
              <div className="absolute top-3 right-3 flex items-center space-x-2 text-sm">
                <span
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    demo.enabled ? 'bg-blue-500' : 'bg-gray-400'
                  )}
                ></span>
                <span className="text-xs text-gray-600">
                  {demo.enabled ? 'Active' : 'Inactive'}
                </span>
                {!demo.enabled && (
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute -right-0 top-6 z-10 w-78 text-sm bg-black text-white px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      Please contact the iTOTEM Support Team to enable this tool.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center text-center mt-6">
                <Icon className="h-8 w-8 text-teal-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">{demo.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{demo.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
