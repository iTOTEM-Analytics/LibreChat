import { useState } from "react";

const models = ["gpt-5 (New)","gpt-5-mini (New)", "gpt-4o", "claude-3-sonnet", "gemini-1.5", "deepseek", "grok"];

export default function ChatSettings() {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <label className="block font-medium cursor-pointer">Select Chat Model:</label>
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
