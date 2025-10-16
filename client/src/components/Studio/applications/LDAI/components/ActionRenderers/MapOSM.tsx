 // frontend/src/applications/LDAI/components/ActionRenderers/MapOSM.tsx
export default function MapOSM({ geojson, fit }: { geojson: any; fit?: "bounds"|"center" }) {
    return (
      <div className="p-3 border border-dashed border-gray-200 rounded text-xs text-gray-600">
        Map (OSM) placeholder — connect your map here.
        <pre className="mt-2 overflow-auto">{JSON.stringify({ fit, sample: geojson?.type }, null, 2)}</pre>
      </div>
    );
  }
  