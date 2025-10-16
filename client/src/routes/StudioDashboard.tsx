import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';

const demos = [
  {
    name: 'LDAI (Local Data AI)',
    description: 'Agentic chat interface with regional intelligence',
    href: '/ldai-admin',
    icon: 'chat',
    enabled: true,
  },
  {
    name: 'Story Finder',
    description: 'Insightful story generator',
    href: '/storyfinder',
    icon: 'file',
    enabled: false,
  },
  {
    name: 'GeoScanner',
    description: 'Detect regional risks intelligently',
    href: '/geoscanner',
    icon: 'compass',
    enabled: false,
  },
  {
    name: 'Sentiment Analyzer',
    description: 'Analyze live sentiment feeds',
    href: '/sentiment',
    icon: 'message',
    enabled: false,
  },
];

const IconComponent = ({ type }: { type: string }) => {
  const iconClass = "h-8 w-8 text-teal-600 mb-3";

  switch (type) {
    case 'chat':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'file':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'compass':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      );
    case 'message':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function StudioDashboard() {
  const navigate = useNavigate();
  const [_, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-slate-600 mb-12">Main Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {demos.map((demo) => {
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
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute -right-0 top-6 z-10 w-78 text-sm bg-black text-white px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      Please contact the iTOTEM Support Team to enable this tool.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center text-center mt-6">
                <IconComponent type={demo.icon} />
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
