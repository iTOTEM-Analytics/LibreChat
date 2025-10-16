// frontend/src/applications/LDAI/components/Chat/SuggestedInitialPrompts.tsx
type P = { onPick: (t: string) => void };
const presets = [
  "How would a $15,000 turtle CI affect fish population in the Gulf of Mexico in 2 years?",
  "What is the economic impact of the sea turtle recovery program?",
  "Why is investment in sea turtles so important for fisheries?",
  "I want to contact the main project manager",
];


export default function SuggestedInitialPrompts({ onPick }: P) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {presets.map((p, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(p);
          }}
          className="text-sm px-3 py-3 bg-gray-100 text-slate-700 rounded-lg hover:bg-slate-500 hover:text-white transition-colors duration-200 text-left h-16 flex items-start"
        >
          {p.length > 125 ? `${p.substring(0, 125)}...` : p}
        </button>
      ))}
    </div>
  );
}


