import { cn } from '~/utils';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
  className?: string;
}

export default function DashboardCard({
  title,
  subtitle,
  stats = [],
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-auto bg-white',
        className,
      )}
    >
      {/* Hero Image */}
      <div className="relative h-32 w-full flex-shrink-0 overflow-hidden">
        <img
          src="/assets/cariboo.jpg"
          alt={title}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title Section */}
        <div className="mb-4 text-center">
          <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-[10px] font-normal uppercase tracking-wide text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {stats.slice(0, 2).map((stat, index) => (
            <div
              key={index}
              className="flex flex-col justify-center rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <div className="text-2xl font-bold text-blue-900">{stat.value}</div>
              <div className="mt-1 text-[10px] leading-tight text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Third stat - full width */}
        {stats[2] && (
          <div className="mb-4 flex flex-col justify-center rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="text-2xl font-bold text-blue-900">{stats[2].value}</div>
            <div className="mt-1 text-[10px] leading-tight text-gray-600">{stats[2].label}</div>
          </div>
        )}

        {/* Footer Logo Area */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="text-[9px] font-normal tracking-wide text-gray-500">
            NATURAL GAS BUILDS B.C.
          </div>
          <div className="flex h-5 items-center">
            <img
              src="/assets/capp.png"
              alt="CAPP Logo"
              className="h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
