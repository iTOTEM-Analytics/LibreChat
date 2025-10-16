import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";

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
          <Upload size={16} /> Upload Model
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
                  <Trash2 className="text-red-600" size={16} />
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
