// Temporarily simplified to fix build issues
export default function StudioLanding() {
  return (
    <div className="font-sans text-gray-800 flex items-center justify-center min-h-screen">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold mb-4">LibreChat Studio</h1>
        <p className="text-xl text-gray-600 mb-8">
          Enhanced AI capabilities and tools for your workflows.
        </p>
        <a
          href="/studio"
          className="inline-block bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
