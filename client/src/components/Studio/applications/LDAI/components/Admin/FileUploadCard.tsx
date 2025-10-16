import { useState } from "react";
import { UploadCloud } from "lucide-react";

const allowedExtensions = [".pdf", ".docx", ".txt", ".csv", ".xlsx", ".xlsm", ".ppt"];

export default function FileUploadCard({ onFileAdd }: { onFileAdd: (file: any) => void }) {
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        setError(`Unsupported file type: ${ext.toUpperCase()}`);
        return;
      }

      setError("");
      onFileAdd({
        name: file.name,
        inMemory: true,
        uploaded: new Date().toISOString().slice(0, 10),
        description: "No description"
      });
    });

    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-8 rounded-lg text-center hover:border-teal-600 transition">
      <UploadCloud className="w-12 h-12 text-teal-600 mb-3" />
      <p className="text-gray-700 text-sm">Drag and drop your files here</p>
      <p className="text-xs text-gray-500 mb-3">
        Supported: PDF, DOCX, TXT, CSV, XLSX, XLSM, PPT
      </p>
      <input
        type="file"
        multiple
        className="hidden"
        id="fileUpload"
        onChange={handleFileChange}
      />
      <label
        htmlFor="fileUpload"
        className="text-teal-700 text-sm font-medium mt-2 underline cursor-pointer"
      >
        Or click to browse files
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
