
type P = { onPick: (t: string) => void };
const presets = [
  "How would a $15,000 turtle CI affect fish population in the Gulf of Mexico in 2 years?",
  "What is the economic impact of the project?",
  "Why is investment in sea turtles important?",
  "When is the next sea turtle nesting season?",
  "I want to contact the main project manager"
];
export default function SuggestedPrompts({ onPick }: P) {
  return (
    <div className="flex gap-2 flex-wrap mb-2">
      {presets.map((p, i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); onPick(p); }}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
