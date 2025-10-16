type InsightCard = {
  label: string;
  value: string | number;
};

interface InsightCardsProps {
  cards: InsightCard[];
  loading?: boolean;
}

export default function InsightCards({ cards, loading = false }: InsightCardsProps) {
  const pulseStyle = { animation: 'pulseSlow 2.4s ease-in-out infinite' } as const;

  if (loading) {
    return (
      <div className="mt-6 grid sm:grid-cols-4 gap-4" style={pulseStyle}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-xl ring-1 ring-slate-200 overflow-hidden">
      {cards.map((card) => (
        <div key={card.label} className="p-4 bg-white/60">
          <div className="text-xs text-slate-500">{card.label}</div>
          <div className="text-2xl font-semibold text-teal-700">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
