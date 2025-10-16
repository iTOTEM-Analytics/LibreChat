import { useEffect, useState } from "react";
import {
  Trash2,
  CircleCheck,
  CircleX,
  Clock,
  Pencil,
  Check,
  X
} from "lucide-react";

export default function UploadedFilesTable({
  files,
  onDelete
}: {
  files: any[];
  onDelete: (filename: string) => void; // ✅ fixed type
}) {
  const [fileStates, setFileStates] = useState<any[]>([]);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editedDesc, setEditedDesc] = useState<string>("");

  useEffect(() => {
    setFileStates(prev => {
      const existing = new Set(prev.map(f => f.name));
      const newOnes = files
        .filter(f => !existing.has(f.name))
        .map(f => ({
          ...f,
          status: "pending",
          inMemory: false,
          active: false,
          description: f.description || getDescriptionFromExtension(f.name)
        }));
      return [...prev, ...newOnes];
    });
  }, [files]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    fileStates.forEach((file, idx) => {
      if (file.status === "pending") {
        const timer = setTimeout(() => {
          setFileStates(prev => {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              status: "active",
              inMemory: true,
              active: true
            };
            return updated;
          });
        }, 5000);
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [fileStates]);

  const toggleActive = (index: number) => {
    setFileStates(prev => {
      const updated = [...prev];
      const f = updated[index];
      const nextActive = !f.active;
      updated[index] = {
        ...f,
        active: nextActive,
        inMemory: nextActive,
        status: nextActive ? "active" : "inactive"
      };
      return updated;
    });
  };

  const getDescriptionFromExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return "File";
    if (["csv", "xlsx", "xlsm", "xls"].includes(ext)) return "Excel Table File";
    if (["docx", "dox", "pdf"].includes(ext)) return "Document";
    return "File";
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return (
          <div className="flex items-center text-green-600">
            <CircleCheck size={16} className="mr-1" />
            Active
          </div>
        );
      case "inactive":
        return (
          <div className="flex items-center text-red-500">
            <CircleX size={16} className="mr-1" />
            Inactive
          </div>
        );
      default:
        return (
          <div className="flex items-center text-yellow-500">
            <Clock size={16} className="mr-1" />
            Pending
          </div>
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="text-gray-500 bg-gray-50 text-left">
              <th className="py-2 px-3 rounded-l-md">File</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">In Memory</th>
              <th className="py-2 px-3">Upload Date</th>
              <th className="py-2 px-3">Description</th>
              <th className="py-2 px-3 text-right rounded-r-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fileStates.map((file, idx) => (
              <tr key={idx} className="border border-gray-200 shadow-sm bg-white text-black">
                <td className="py-2 px-3">{file.name}</td>
                <td className="py-2 px-3">{getStatusDisplay(file.status)}</td>
                <td className="py-2 px-3">{file.inMemory ? "Yes" : "No"}</td>
                <td className="py-2 px-3">{file.uploaded}</td>
                <td className="py-2 px-3">
                  {editIdx === idx ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editedDesc}
                        onChange={(e) => setEditedDesc(e.target.value)}
                        className="border px-2 py-1 rounded text-sm text-black"
                      />
                      <button
                        onClick={() => {
                          setFileStates(prev => {
                            const updated = [...prev];
                            updated[idx].description = editedDesc;
                            return updated;
                          });
                          setEditIdx(null);
                        }}
                      >
                        <Check size={16} className="text-green-600" />
                      </button>
                      <button onClick={() => setEditIdx(null)}>
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{file.description}</span>
                      <button
                        onClick={() => {
                          setEditIdx(idx);
                          setEditedDesc(file.description);
                        }}
                      >
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div
                      onClick={() => toggleActive(idx)}
                      className="relative w-10 h-5 flex items-center bg-gray-300 rounded-full cursor-pointer transition"
                    >
                      <div
                        className={`w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          file.active ? "translate-x-5 bg-blue-600" : "translate-x-1 bg-white"
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => setConfirmIndex(idx)}
                      className="p-1 rounded transition"
                    >
                      <Trash2
                        size={16}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Remove File?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove{" "}
              <span className="font-medium text-black">{fileStates[confirmIndex].name}</span> from the chat memory?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmIndex(null)}
                className="px-4 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(fileStates[confirmIndex].name); // ✅ now filename
                  setConfirmIndex(null);
                }}
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
