import { Trash2 } from "lucide-react";

const endpoints = [
  { name: "OpenAI GPT-4", url: "https://api.openai.com", added: "2025-08-04", type: "LLM" },
  { name: "StatsCan API", url: "https://statcan.gc.ca/api", added: "2025-08-01", type: "Data" }
];

export default function EndpointsCard() {
  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr className="text-gray-500 border-b">
          <th className="py-2 px-3">Name</th>
          <th className="py-2 px-3">Type</th>
          <th className="py-2 px-3">Added</th>
          <th className="py-2 px-3">URL</th>
          <th className="py-2 px-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map((e, idx) => (
          <tr key={idx} className="border-b hover:bg-gray-50">
            <td className="py-2 px-3">{e.name}</td>
            <td className="py-2 px-3">{e.type}</td>
            <td className="py-2 px-3">{e.added}</td>
            <td className="py-2 px-3 text-blue-700 underline">{e.url}</td>
            <td className="py-2 px-3 text-right">
              <button className="p-1 rounded hover:bg-red-600 hover:text-white transition">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
