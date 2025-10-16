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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
