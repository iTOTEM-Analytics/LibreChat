// frontend/src/applications/LDAI/components/ActionPanelRenderer.tsx
import { useMemo } from "react";
import type { Action } from "../types/Action";
import Table from "./ActionRenderers/Table";
import BarChart from "./ActionRenderers/BarChart";
import PieChart from "./ActionRenderers/PieChart";
import MapOSM from "./ActionRenderers/MapOSM";
import ContactForm from "./ActionRenderers/ContactForm";
import ContactCard from "./ActionRenderers/ContactCard";
import WebsiteCard from "./ActionRenderers/WebsiteCard";
import InsightCard from "./ActionRenderers/InsightCard";

export default function ActionPanelRenderer({ actions }: { actions: Action[] }) {
  console.log("[ActionPanelRenderer] Received actions:", actions.map(a => ({
    kind: a.kind,
    type: a.type,
    title: a.title,
    hasPayload: !!a.payload
  })));
  
  const visuals = useMemo(() => {
    // Filter out actions that result in errors
    const validVisuals = actions.filter(a => {
      if (a.kind !== "visual") {
        console.log("[ActionPanelRenderer] Filtering out non-visual action:", a.kind);
        return false;
      }
      
      console.log("[ActionPanelRenderer] Processing visual action:", a.type, a.title);
      
      // Check for table actions with error data
      if (a.type === "table" && a.payload) {
        const hasErrorData = (a.payload.columns || []).some((col: any) => 
          typeof col === 'string' && (
            col.toLowerCase().includes('error') || 
            col.toLowerCase().includes('validation') ||
            col.toLowerCase().includes('missing')
          )
        ) || (a.payload.rows || []).some((row: any) => 
          row.some((cell: any) => 
            typeof cell === 'string' && (
              cell.toLowerCase().includes('error') || 
              cell.toLowerCase().includes('validation') ||
              cell.toLowerCase().includes('missing') ||
              cell.toLowerCase().includes('required')
            )
          )
        );
        
        if (hasErrorData) {
          console.log("[ActionPanelRenderer] Filtering out error table");
          return false; // Don't show error tables as assets
        }
      }
      
      // Check for other action types that might contain error messages
      if (a.payload && typeof a.payload === 'object') {
        const payloadStr = JSON.stringify(a.payload).toLowerCase();
        if (payloadStr.includes('error') || 
            payloadStr.includes('validation') || 
            payloadStr.includes('missing') || 
            payloadStr.includes('required') ||
            payloadStr.includes('failed') ||
            payloadStr.includes('exception')) {
          console.log("[ActionPanelRenderer] Filtering out action with error payload:", a.type);
          return false; // Don't show actions with error payloads
        }
      }
      
      console.log("[ActionPanelRenderer] Action passed filter:", a.type, a.title);
      return true;
    });
    
    console.log("[ActionPanelRenderer] Final valid visuals:", validVisuals.map(v => ({ type: v.type, title: v.title })));
    return validVisuals;
  }, [actions]);
  
  if (!visuals.length) {
    const notes = actions.filter(a => a.kind !== "visual");
    const hasErrorVisuals = actions.some(a => a.kind === "visual");
    
    if (hasErrorVisuals) {
      return (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium">Tool Execution Issues</span>
          </div>
          <p className="text-gray-500">
            Some requested data could not be retrieved due to missing parameters or validation errors. 
            Please try rephrasing your request or provide additional context.
          </p>
        </div>
      );
    }
    
    return (
      <div className="text-sm text-gray-500">
        {notes.length ? "No panel visuals; see notes in chat." : "No actions/visuals for this turn."}
      </div>
    );
  }

  return (
    <div className="space-y-10 p-1">
      {visuals.map((a, i) => (
        <div key={i} className={`bg-white border border-gray-200 rounded-md p-4 text-sm ${i === 0 ? 'mt-2' : 'my-6'}`}>
          {a.title && a.type !== "website_card" && <div className="text-gray-700 font-medium mb-3">{a.title}</div>}
          <Visual a={a} />
          <div className="mt-3 text-[11px] text-gray-400">
            {a.meta?.tool ? <>from <span className="font-mono">{a.meta.tool}</span></> : null}
            {typeof a.meta?.latency_ms === "number" ? <> · {a.meta.latency_ms}ms</> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function Visual({ a }: { a: Action }) {
  switch (a.type) {
    case "table":
      return <Table columns={a.payload?.columns || []} rows={a.payload?.rows || []} />;
    case "plotly_bar":
      return <BarChart x={a.payload?.x || []} y={a.payload?.y || []} title={a.payload?.title} />;
    case "plotly_pie":
      return <PieChart labels={a.payload?.labels || []} values={a.payload?.values || []} title={a.payload?.title} />;
    case "map_osm":
      return <MapOSM geojson={a.payload?.geojson} fit={a.payload?.fit} />;
    case "form_contact":
      return <ContactForm fields={a.payload?.fields || []} submitUrl={a.payload?.submitUrl} />;
        case "contact_card":
       // Show as regular contact card (includes website URLs like LinkedIn)
       return <ContactCard 
         fullName={a.payload?.fullName || "Contact"}
         title={a.payload?.title}
         org={a.payload?.org}
         email={a.payload?.email}
         phone={a.payload?.phone}
         website={a.payload?.website}
         linkedin={a.payload?.linkedin}
         note={a.payload?.note}
       />;
    case "website_card":
       // Dedicated website card for website-only responses
       return <WebsiteCard website={a.payload.website} title={a.payload.title || "Website"} />;
    case "insight_card":
      return <InsightCard 
        heading={a.payload?.heading || "Insights"}
        insights={a.payload?.insights || []}
        cta={a.payload?.cta || "Turn insights into action."}
        imageUrl={a.payload?.imageUrl}
        seedKey={a.payload?.seedKey}
        className="w-full"
      />;
    case "download":
      return (
        <a
          href={`data:${a.payload?.mime || "application/octet-stream"};base64,${a.payload?.dataBase64 || ""}`}
          download={a.payload?.filename || "download.bin"}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 text-sm"
        >
          Download {a.payload?.filename || ""}
        </a>
      );
    default:
      return <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(a.payload ?? {}, null, 2)}</pre>;
  }
}
