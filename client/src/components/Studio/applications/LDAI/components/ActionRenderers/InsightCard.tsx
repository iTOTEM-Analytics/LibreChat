// frontend/src/applications/LDAI/components/ActionRenderers/InsightCard.tsx
import React, { useMemo } from "react";
import { Share2, Download } from "lucide-react";
import img1 from "../../../../assets/sea-turtle-1.jpg";
import img2 from "../../../../assets/sea-turtle-2.jpg";
import img3 from "../../../../assets/sea-turtle-3.jpg";
import img4 from "../../../../assets/sea-turtle-4.jpg";
import img5 from "../../../../assets/seagrass-1.jpg";

const BG_CHOICES = [img1, img2, img3, img4, img5];

interface InsightCardProps {
  heading?: string;
  insights?: Array<{ title: string; value: string | number }>;
  cta?: string;
  imageUrl?: string;
  seedKey?: string;
  className?: string;
}


function pickBackground(imageUrl?: string, seedKey?: string, fallbackKey?: string): string {
  if (imageUrl) return imageUrl;
  const key = (seedKey ?? fallbackKey ?? "x");
  const seed = key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return BG_CHOICES[seed % BG_CHOICES.length];
}

const InsightCard: React.FC<InsightCardProps> = ({
  heading = "Insights",
  insights = [],
  cta = "Turn insights into action.",
  imageUrl, 
  seedKey,
  className,
}) => {
  const bg = useMemo(() => pickBackground(imageUrl, seedKey, heading), [imageUrl, seedKey, heading]);
  
  // Ensure insights is an array and always has exactly 4 items
  const validInsights = Array.isArray(insights) ? insights : [];
  
  // Default insights if none provided or insufficient
  const defaultInsights = [
    { title: "Sea Turtles Saved", value: "500+" },
    { title: "Seagrass Restored", value: "20,500m²" },
    { title: "Carbon Captured", value: "200 tonnes" },
    { title: "Communities Supported", value: "12 coastal" }
  ];
  
  // Ensure we always have exactly 4 insights
  const items = validInsights.length >= 4 
    ? validInsights.slice(0, 4) 
    : [...validInsights, ...defaultInsights].slice(0, 4);
  
  // If no insights at all, show a placeholder (this shouldn't happen now)
  if (items.length === 0) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-50 ${className ?? ""}`}>
        <div className="p-4 sm:p-6 text-center">
          <h3 className="text-gray-700 text-base font-semibold mb-2">{heading}</h3>
          <p className="text-gray-500 text-sm">No insights available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-200 shadow-sm w-full max-w-full ${className ?? ""}`}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden
      />
      {/* Dark overlay so image still visible but content pops */}
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden />

      <div className="relative p-4 sm:p-6 w-full">
        <h3 className="text-white text-base font-semibold tracking-wide mb-4">
          {heading}
        </h3>

        <div className="grid grid-cols-2 gap-3 w-full">
          {items.map((it, i) => (
            <div
              key={`${it.title}-${i}`}
              className="rounded-md border border-white/15 bg-white/10 backdrop-blur-sm p-4 min-h-[90px] flex flex-col justify-between w-full"
            >
              <div className="text-teal-200 font-bold text-xs uppercase tracking-wide leading-tight mb-2 w-full text-center">
                {it.title || `Insight ${i + 1}`}
              </div>
              <div className="text-white text-lg font-semibold leading-tight text-center w-full">
                {String(it.value || "N/A")}
              </div>
            </div>
          ))}
        </div>

        {cta && (
          <div className="mt-6 w-full text-center text-white text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg px-4 py-3 border border-teal-500/30 hover:from-teal-500/80 hover:to-teal-600/80 transition-all duration-200  shadow-sm">
            {cta}
          </div>
        )}

        {/* Share and Download Icons - Bottom Right */}
        <div className="absolute bottom-1 right-3 flex items-center gap-2">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-black/30 transition-all duration-200"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: heading,
                  text: `Check out these insights: ${items.map(i => `${i.title}: ${i.value}`).join(', ')}`,
                });
              } else {
                navigator.clipboard.writeText(`${heading}\n${items.map(i => `${i.title}: ${i.value}`).join('\n')}`);
              }
            }}
            title="Share insights"
          >
            <Share2 size={14} />
          </button>
          
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-black/30 transition-all duration-200"
            onClick={() => {
              const data = `${heading}\n${items.map(i => `${i.title}: ${i.value}`).join('\n')}\n\n${cta}`;
              const blob = new Blob([data], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${heading.replace(/[^a-zA-Z0-9]/g, '_')}_insights.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            title="Download insights"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
