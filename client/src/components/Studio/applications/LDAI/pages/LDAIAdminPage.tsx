import { useState } from "react";
import LineChart from "../components/Admin/AdminVisuals/LineChart";
import PieChart from "../components/Admin/AdminVisuals/PieChart";
import EfficiencyChart from "../components/Admin/AdminVisuals/EfficiencyChart";
import FileUploadCard from "../components/Admin/FileUploadCard";
import UploadedFilesTable from "../components/Admin/UploadedFilesTable";
import ModelsUploadCard from "../components/Admin/ModelsUploadCard";
import EndpointsCard from "../components/Admin/EndpointsCard";
import ChatSettings from "../components/Admin/ChatSettings";

const tabs = ["Overview", "Upload Center", "Chat Settings"];

export default function LDAIAdminPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleAddFile = (file: any) => {
    if (file.error) {
      console.error(file.error); // or use toast
      return;
    }
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleDeleteFile = (index: number) => {
    const copy = [...uploadedFiles];
    copy.splice(index, 1);
    setUploadedFiles(copy);
  };

  return (
    <div>
      <div className="flex space-x-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px border-b-2 transition text-sm font-medium cursor-pointer ${
              activeTab === tab
                ? "border-teal-600 text-black"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Project Overview</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
            This AI chat integration is designed to assist the Texas State Aquarium (TSA) with sea turtle recovery, seagrass management, fisheries impact analysis, and conservation funding engagement. The LDAI tool aligns with the scope of the Sea Turtle Recovery and Fisheries ROI Program, focusing on hyper-localized ecological insights, environmental compliance, and user-driven chat retrieval that connects funders, fishery partners, and community stakeholders directly to measurable impacts.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Usage & Quotas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
              <StatCard label="# of Chat Users" value="3" />
              <StatCard label="# of Public Datasets" value="8" />
              <StatCard label="# of Endpoints" value="5" />
              <StatCard label="# of Custom Models" value="2" />
              <StatCard label="# of iTOTEM Models" value="1" />
              <StatCard label="Memory Usage" value="68%" />
              <StatCard label="Chat Quota Remaining" value="12 / 50 entries" />
              <StatCard label="Active Chat Sessions" value="2" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Chat Visualizations</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <LineChart />
              <PieChart />
              <EfficiencyChart />
            </div>
          </div>
        </div>
      )}

      {activeTab === "Upload Center" && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Files</h2>
            <FileUploadCard onFileAdd={handleAddFile} />
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Data</h2>
            <UploadedFilesTable
              files={uploadedFiles}
              onDelete={(filename: string) => {
                setUploadedFiles(prev => prev.filter(f => f.name !== filename));
              }}
            />
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Integrated Models</h2>
            <ModelsUploadCard />
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Used Endpoints</h2>
            <EndpointsCard />
          </div>
        </div>
      )}

      {activeTab === "Chat Settings" && (
        <div className="text-gray-500 text-sm">
          Chat Settings coming soon...
          <ChatSettings />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-800">{value}</div>
    </div>
  );
}
