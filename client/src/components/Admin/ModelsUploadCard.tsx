import { useState } from "react";

export default function ModelsUploadCard() {
  const [models, setModels] = useState([
    {
      name: "climate-risk-model.pkl",
      uploaded: "2025-07-25",
      active: true,
      description: "Used for emission forecasting"
    }
  ]);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pkl";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file.name.endsWith(".pkl")) {
        setError("Only .pkl model files are supported.");
        return;
      }
      setError("");
      const newModel = {
        name: file.name,
        uploaded: new Date().toISOString().slice(0, 10),
        active: true,
        description: "No description"
      };
      setModels([...models, newModel]);
    };
    input.click();
  };

  const handleDelete = () => {
    if (confirmIndex !== null) {
      const updated = [...models];
      updated.splice(confirmIndex, 1);
      setModels(updated);
      setConfirmIndex(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">Upload machine learning models (.pkl)</p>
        <button onClick={handleUpload} className="flex items-center gap-1 text-sm text-teal-700 hover:underline cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Model
        </button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <table className="w-full text-sm border-t border-gray-200">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 px-3">Model</th>
            <th className="py-2 px-3">Active</th>
            <th className="py-2 px-3">Upload Date</th>
            <th className="py-2 px-3">Description</th>
            <th className="py-2 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{model.name}</td>
              <td className="py-2 px-3">{model.active ? "Yes" : "No"}</td>
              <td className="py-2 px-3">{model.uploaded}</td>
              <td className="py-2 px-3">{model.description}</td>
              <td className="py-2 px-3 text-right">
                <button onClick={() => setConfirmIndex(idx)} className="p-1 rounded transition cursor-pointer">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to remove this model from the chat memory?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmIndex(null)}
                className="px-4 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
