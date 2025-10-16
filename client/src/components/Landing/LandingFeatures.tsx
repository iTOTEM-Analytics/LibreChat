// ABT-TBK
// src/components/Landing/LandingFeatures.tsx
import problemImg from '~/assets/placeholder.jpg';
import challengeImg from '~/assets/placeholder.jpg';
import solutionImg from '~/assets/placeholder.jpg';
import demoMap from '~/assets/placeholder.jpg';

export default function LandingFeatures() {
  return (
    <section className="font-sans text-gray-800">
      {/* Scroll Line */}
        <div id="scroll-line" className="w-full overflow-hidden -mb-10">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-24">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#2ec499" />
              </linearGradient>
            </defs>
            <path
              id="animated-path"
              d="M0,50 Q500,0 1000,50"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
      </div>
      
      {/* The Problem */}
      <div className="flex flex-col md:flex-row items-center gap-12 py-24 px-6 w-full">
        <div className="md:w-1/2 md:order-1">
          <h2 className="text-5xl font-bold mb-4">The Problem</h2>
          <p className="text-xl text-gray-700">
            Advocacy and outreach efforts often fall behind due to lack of timely, hyper-localized insights. Organizations struggle to convey relevant, tailored information where it matters most.
          </p>
        </div>
        <div className="md:w-1/2 md:order-2 flex justify-end">
          <img src={problemImg as string} alt="Problem" className="w-full max-w-xl rounded-xl shadow-xl" />
        </div>
      </div>
      {/* The Challenge */}
      <div className="flex flex-col-reverse md:flex-row items-center gap-12 py-24 px-6 w-full">
        <div className="md:w-1/2 md:order-1 flex justify-start">
          <img src={challengeImg as string} alt="Challenge" className="w-full max-w-xl rounded-xl shadow-xl" />
        </div>
        <div className="md:w-1/2 md:order-2">
          <h2 className="text-5xl font-bold mb-4">The Challenge</h2>
          <p className="text-xl text-gray-700">
            Traditional automation doesn't scale with location-based intelligence. Data pipelines aren’t built for advocacy or lead generation with community-level precision.
          </p>
        </div>
      </div>
      
      {/* The Solution */}
      <div className="flex flex-col md:flex-row items-center gap-12 py-24 px-6 w-full">
        <div className="md:w-1/2 md:order-1">
          <h2 className="text-5xl font-bold mb-4">The Solution</h2>
          <p className="text-xl text-gray-700">
            iTOTEM Studio enables intelligent model deployment, custom chat interfaces, and location-aware data pipelines—all connected to census, open street, and public info APIs for rapid delivery.
          </p>
        </div>
        <div className="md:w-1/2 md:order-2 flex justify-end">
          <img src={solutionImg as string} alt="Solution" className="w-full max-w-xl rounded-xl shadow-xl" />
        </div>
      </div>

      {/* Geo-Spatial Focus */}
      <div className="py-12 px-6 text-center bg-[#e6f3f0]">
        <h2 className="text-4xl font-sans font-bold mb-4">Our Hyper Local Geospatial Focus</h2>
        <p className="max-w-4xl font-sans mx-auto text-xl mb-8">
          iTOTEM AI demos provide multi-level geographic insights, from national to provincial to Indigenous overlays, so you can target and engage with unmatched precision.
        </p>
        <img
          src={demoMap as string}
          alt="Geospatial Focus"
          className="mx-auto max-w-lg rounded-md shadow-lg"
        />
      </div>


      {/* Explore our Demos */}
      <div className="py-24 px-6 max-w-7xl mx-auto" id="solutions">
        <h2 className="text-4xl font-bold mb-12 text-center">Explore Our AI Products</h2>
        <div className="grid gap-12 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <a href="/ldai" className="bg-amber-50  p-12 min-h-[260px] rounded-xl transition-all text-center shadow">
            <h3 className="text-4xl font-semibold mb-4 text-teal-900">LDAI</h3>
            <p className="text-xl text-teal-800">Local Data AI<br/>B2B Agentic AI Chat Interface</p>
          </a>
          <a href="/geolab" className="bg-green-50  p-12 min-h-[260px] rounded-xl transition-all text-center shadow">
            <h3 className="text-4xl font-semibold mb-4 text-emerald-900">GEO Scanner</h3>
            <p className="text-xl text-emerald-800">Geospatial analysis & visualization</p>
          </a>
          <a href="/storyfinder" className="bg-orange-50  p-12 min-h-[260px] rounded-xl transition-all text-center shadow">
            <h3 className="text-4xl font-semibold mb-4 text-orange-900">Story Finder</h3>
            <p className="text-xl text-orange-800">Insightful story generator</p>
          </a>
        </div>
      </div>



      {/* Releases */}
      <div className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Release Notes</h2>
        <table className="w-full text-left ">
          <thead>
            <tr className="text-gray-600 text-sm">
              <th className="py-2 pr-6">Recent Releases</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="py-3 pr-6">LDAI v1.1.0 – B2B AI Chat Interface</td>
              <td className="py-3">July 2025</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="py-3 pr-6">Geo Lab v2.1.1 – Region Risk Analyzer</td>
              <td className="py-3">March 2025</td>
            </tr>
            {/* Add more here */}
          </tbody>
        </table>
      </div>


    </section>
  );
}
