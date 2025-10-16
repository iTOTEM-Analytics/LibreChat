// frontend/src/applications/LDAI/components/Chat/InlineOptions.tsx
import { useChatStore } from "./useChatStore";
import MapPicker from "./MapPicker";

export default function InlineOptions({ refId, onSend }: { refId: string; onSend: (text: string) => Promise<void> }) {
  const s = useChatStore();
  const sug = s.suggestionsByRef[refId];
  const isStreaming = s.isStreaming;
  
  // Get the latest assistant message refId
  const latestAssistantRefId = [...s.turns].reverse().find((t) => t.role === "assistant")?.refId;
  const isLatest = latestAssistantRefId === refId;
  
  // Only show loading state for the very latest message when actively streaming
  const showLoading = isLatest && isStreaming && !sug;
  
  // Only show if there are actual suggestions OR if this is the current streaming message
  if (!sug && !showLoading) return null;

  const handleOptionClick = (option: string) => {
    // Send the option directly to chat
    onSend(option);
  };

  // Show loading state while waiting for suggestions
  if (showLoading) {
    return (
      <div className="w-full max-w-[900px] mx-auto">
        <div className="flex items-center gap-2 mt-3 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
          <span className="text-sm">Loading options...</span>
        </div>
      </div>
    );
  }

  const renderOptions = () => {
    if (!sug?.options || sug.options.length === 0) return null;

    switch (sug.option_type) {
      case "buttons":
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {sug.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded-xl transition-colors duration-200 font-medium"
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case "select":
        return (
          <div className="mt-3">
            <select 
              onChange={(e) => handleOptionClick(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">{sug.placeholder || "Select an option..."}</option>
              {sug.options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case "input":
        return (
          <div className="mt-3">
            <input
              type="text"
              placeholder={sug.placeholder || "Type your response..."}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleOptionClick(e.currentTarget.value.trim());
                }
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        );
      
      case "toggle":
        return (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {sug.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      
      case "range":
        return (
          <div className="mt-3">
            <input
              type="range"
              min={sug?.schema?.min ?? 0}
              max={sug?.schema?.max ?? 100}
              step={sug?.schema?.step ?? 5}
              defaultValue={sug?.schema?.min ?? 0}
              className="w-full"
              onChange={(e) => handleOptionClick(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-1">Drag to choose a value</div>
          </div>
        );
      
      case "number":
        return (
          <div className="mt-3">
            <input
              type="number"
              min={sug?.schema?.min}
              max={sug?.schema?.max}
              step={sug?.schema?.step ?? 1}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onChange={(e) => handleOptionClick(e.target.value)}
              placeholder="Enter a number..."
            />
          </div>
        );
      
      case "datetime":
        return (
          <div className="mt-3">
            <input
              type={sug.option_type === "datetime" ? "datetime-local" : "date"}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onChange={(e) => handleOptionClick(e.target.value)}
            />
          </div>
        );
      
      case "year":
        return (
          <div className="mt-3">
            <input
              type="number"
              min={sug?.schema?.min ?? 1900}
              max={sug?.schema?.max ?? 2030}
              step={1}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onChange={(e) => handleOptionClick(e.target.value)}
              placeholder="Enter a year..."
            />
          </div>
        );
      
      case "rating":
        return (
          <div className="mt-3 flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button 
                key={n} 
                onClick={() => handleOptionClick(String(n))}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                {n}★
              </button>
            ))}
          </div>
        );
      
      case "table_row_select":
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {sug.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case "map_point":
        return (
          <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
            <MapPicker
              mode={sug.option_type}
              center={sug?.schema?.map?.center ?? [27.8, -97.4]}
              zoom={sug?.schema?.map?.zoom ?? 6}
              onPick={(value) => handleOptionClick(value)}
            />
          </div>
        );
      
      case "map_bbox":
        return (
          <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
            <MapPicker
              mode={sug.option_type}
              center={sug?.schema?.map?.center ?? [27.8, -97.4]}
              zoom={sug?.schema?.map?.zoom ?? 6}
              onPick={(value) => handleOptionClick(value)}
            />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {sug.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                {option}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-[820px] mx-auto">
      {renderOptions()}
    </div>
  );
}
