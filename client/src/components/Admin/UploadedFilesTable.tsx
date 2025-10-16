import { useEffect, useState } from "react";

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
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Active
          </div>
        );
      case "inactive":
        return (
          <div className="flex items-center text-red-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Inactive
          </div>
        );
      default:
        return (
          <div className="flex items-center text-yellow-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
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
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button onClick={() => setEditIdx(null)}>
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
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
                      <svg className="w-4 h-4 text-gray-400 hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
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
