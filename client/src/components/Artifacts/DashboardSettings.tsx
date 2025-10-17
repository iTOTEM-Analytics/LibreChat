import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '~/utils';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
  onSave: (data: {
    title: string;
    subtitle: string;
    stats: Array<{ label: string; value: string | number }>;
  }) => void;
}

export default function DashboardSettings({
  isOpen,
  onClose,
  title,
  subtitle,
  stats,
  onSave,
}: DashboardSettingsProps) {
  const [formData, setFormData] = useState({
    title,
    subtitle,
    stats: [...stats],
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const updateStat = (index: number, field: 'label' | 'value', value: string) => {
    const newStats = [...formData.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setFormData({ ...formData, stats: newStats });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl',
          )}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Dashboard Settings
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Stats */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Statistics</label>
              <div className="space-y-3">
                {formData.stats.map((stat, index) => (
                  <div key={index} className="rounded-md border border-gray-200 p-3">
                    <div className="mb-2 text-xs font-medium text-gray-500">
                      Stat {index + 1}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Value (e.g., $120.7M)"
                        value={stat.value}
                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g., Spent with Businesses)"
                        value={stat.label}
                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
