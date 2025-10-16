// frontend/src/applications/LDAI/components/Chat/MapPicker.tsx
import { useEffect, useRef } from "react";
import { useChatStore } from "./useChatStore";

// Leaflet via CDN (no extra install)
function ensureLeaflet() {
  if ((window as any).L) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

export default function MapPicker({
  mode,
  center,
  zoom,
  onPick,
}: {
  mode: "map_point" | "map_bbox";
  center: [number, number];
  zoom: number;
  onPick: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pickedMarker = useRef<any>(null);
  const bboxRect = useRef<any>(null);
  const s = useChatStore();

  useEffect(() => {
    let map: any;
    let L: any;
    let downLatLng: any = null;

    ensureLeaflet().then(() => {
      L = (window as any).L;
      if (!ref.current) return;

      map = L.map(ref.current, { zoomControl: false, attributionControl: false });
      const tiles = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {}
      );
      tiles.addTo(map);

      // Minimal Texas boundary overlay: rough bbox
      const texasBounds = L.latLngBounds([25.8, -106.7], [36.5, -93.5]);
      const txRect = L.rectangle(texasBounds, { color: "#9CA3AF", weight: 1, fillOpacity: 0 });
      txRect.addTo(map);

      map.setView(center, zoom);

      if (mode === "map_point") {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (pickedMarker.current) pickedMarker.current.remove();
          pickedMarker.current = L.circleMarker([lat, lng], { radius: 6, color: "#0f766e", weight: 2, fillOpacity: 0.6 }).addTo(map);
          onPick(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        });
      } else {
        map.on("mousedown", (e: any) => {
          downLatLng = e.latlng;
          if (bboxRect.current) { bboxRect.current.remove(); bboxRect.current = null; }
        });
        map.on("mousemove", (e: any) => {
          if (!downLatLng) return;
          const b = L.latLngBounds(downLatLng, e.latlng);
          if (!bboxRect.current) bboxRect.current = L.rectangle(b, { color: "#0f766e", weight: 1, fillOpacity: 0.05 });
          else bboxRect.current.setBounds(b);
          bboxRect.current.addTo(map);
        });
        map.on("mouseup", (e: any) => {
          if (!downLatLng) return;
          const b = L.latLngBounds(downLatLng, e.latlng);
          downLatLng = null;
          onPick(`BBox: SW(${b.getSouth().toFixed(4)}, ${b.getWest().toFixed(4)}) NE(${b.getNorth().toFixed(4)}, ${b.getEast().toFixed(4)})`);
        });
      }
    });

    return () => {
      try { pickedMarker.current = null; bboxRect.current = null; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="w-full">
      <div className="px-3 py-2 text-xs text-slate-600">
        {mode === "map_point" ? "Pinpoint a location in Texas" : "Drag to draw a box in Texas"}
      </div>
      <div ref={ref} className="h-56 w-full" />
      <div className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => s.setDraft("Select a spot near Corpus Christi, TX")}
          className="border border-teal-700 text-slate-700 rounded-md px-3 py-1.5 hover:bg-teal-50"
        >
          Use Corpus Christi area
        </button>
      </div>
    </div>
  );
}
