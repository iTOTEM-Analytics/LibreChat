import { useState } from 'react';
import { Settings } from 'lucide-react';
import DashboardCard from './DashboardCard';
import DashboardSettings from './DashboardSettings';
import { cn } from '~/utils';

interface DashboardCardWrapperProps {
  initialTitle?: string;
  initialSubtitle?: string;
  initialStats?: Array<{
    label: string;
    value: string | number;
  }>;
}

export default function DashboardCardWrapper({
  initialTitle = 'CARIBOO',
  initialSubtitle = 'UPSTREAM SUPPLY CHAIN SPEND 2016-2024',
  initialStats = [
    { label: 'Spent with Businesses', value: '$120.7M' },
    { label: 'Businesses Engaged at Peak', value: '35' },
    { label: 'Spent with Indigenous Businesses', value: '11.5%' },
  ],
}: DashboardCardWrapperProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cardData, setCardData] = useState({
    title: initialTitle,
    subtitle: initialSubtitle,
    stats: initialStats,
  });

  const handleSave = (data: {
    title: string;
    subtitle: string;
    stats: Array<{ label: string; value: string | number }>;
  }) => {
    setCardData(data);
  };

  return (
    <>
      <div className="flex h-full w-full items-center justify-center bg-gray-50 p-6">
        <div className="relative w-full max-w-sm">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              'absolute right-2 top-2 z-10 rounded-full bg-white p-2 text-gray-600 shadow-md transition-all hover:bg-gray-100 hover:text-gray-900',
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Card Container */}
          <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
            <DashboardCard
              title={cardData.title}
              subtitle={cardData.subtitle}
              stats={cardData.stats}
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <DashboardSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={cardData.title}
        subtitle={cardData.subtitle}
        stats={cardData.stats}
        onSave={handleSave}
      />
    </>
  );
}
