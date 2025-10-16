// Temporarily simplified to fix build issues
export default function StudioDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Studio Dashboard</h1>
        <p className="text-gray-600 mt-2">Applications are being optimized and will be available soon.</p>
      </div>

      <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-600 text-center">
          Studio applications are temporarily disabled while we optimize the build process.
          <br />
          Please check back soon!
        </p>
      </div>
    </div>
  );
}
