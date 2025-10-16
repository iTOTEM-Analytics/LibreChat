// backend/api/v1/ldai/promptcomposer.ts
import { promises as fs } from "fs";
import path from "path";
import { listAllToolDefs } from "./mcp.service";

// Load project knowledge from markdown file
let projectKnowledgeCache: string | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadProjectKnowledge(): Promise<string> {
  const now = Date.now();
  
  // Return cached version if still valid
  if (projectKnowledgeCache && (now - lastCacheTime) < CACHE_DURATION) {
    return projectKnowledgeCache;
  }
  
  try {
    const knowledgePath = path.join(__dirname, "data/knowledge/project_knowledge.md");
    const knowledge = await fs.readFile(knowledgePath, "utf-8");
    const trimmed = knowledge.trim();
    
    // Update cache
    projectKnowledgeCache = trimmed;
    lastCacheTime = now;
    
    return trimmed;
  } catch (error) {
    console.warn("[KNOWLEDGE] Failed to load project knowledge:", error);
    // Return cached version if available, even if expired
    return projectKnowledgeCache || "";
  }
}

// Minimal prompt composer (KB later)
export async function composeMainSystem(base: string, refId: string, sessionSummary?: string, kbSnippets?: string[]) {
  const projectKnowledge = await loadProjectKnowledge();
  
  const parts = [
    base.trim(),
    projectKnowledge ? `## Project Knowledge Base\n${projectKnowledge}` : "",
    sessionSummary ? `Session summary:\n${sessionSummary}` : "",
    kbSnippets?.length ? `Relevant knowledge:\n- ${kbSnippets.join("\n- ")}` : "",
    `Current turn reference: #${refId}\n- If you mention visuals/actions, include "ref #${refId}" once.`,
  ].filter(Boolean);
  return parts.join("\n\n");
}

// Planner: tools + UI actions (visuals) + inline suggestions (for chat UI)
export async function plannerMessages({
  user,
  assistant,
  sessionSummary,
}: {
  user: string;
  assistant: string;
  sessionSummary?: string;
}) {
  // Gather MCP tool inventory (server + tool names) to inform the planner
  let toolsSection = "";
  try {
    const defs = await listAllToolDefs();
    if (defs && defs.length > 0) {
      const lines = defs.map((d: any) => {
        if (d.tools && Array.isArray(d.tools)) {
          const names = d.tools
            .map((t: any) => t?.name)
            .filter(Boolean)
            .join(", ");
          return names ? `- ${d.server}: ${names}` : null;
        }
        return null;
      }).filter(Boolean);
      
      if (lines.length > 0) {
        toolsSection = `\nAVAILABLE MCP TOOLS (server: methods)\n${lines.join("\n")}`;
      } else {
        toolsSection = "\nAVAILABLE MCP TOOLS: No tools found in registered servers";
      }
    } else {
      toolsSection = "\nAVAILABLE MCP TOOLS: No servers registered";
    }
  } catch (e) {
    console.warn("[PROMPT] Failed to enumerate MCP tools:", e);
    toolsSection = "\nAVAILABLE MCP TOOLS: (failed to enumerate - check server logs)";
  }

  const system = `
  You are a tool planner. Produce ONE JSON object:
  
  "tool_calls": [{ "server": "<mcp server name>", "method": "<tool method>", "params": { ... } }],
  "actions": [
    { "v": 1, "refId": "<string>", "kind": "visual",
      "type": "table"|"plotly_bar"|"plotly_pie"|"map_osm"|"form_contact"|"download"|"contact_card"|"insight_card",
      "title": "<optional>", "payload": { ... } },
    { "v": 1, "refId": "<string>", "kind": "note", "type": "suggestions",
      "payload": {
        "next": "<one follow-up question>",
        "option_type": "buttons"|"select"|"input"|"number"|"range"|"toggle"|"date"|"datetime"|"year"|"rating"|"map_point"|"map_bbox"|"table_row_select",
        "options": ["<choice1>", "<choice2>", "<choice3>"],
        "placeholder": "<input hint>",
        "schema": { "min": 0, "max": 100, "step": 5 }
      }
    }
  ]
  
  COMPLETE JSON EXAMPLE:
  {
    "tool_calls": [],
    "actions": [
      {
        "v": 1,
        "refId": "123",
        "kind": "visual",
        "type": "plotly_bar",
        "title": "Investment Analysis",
        "payload": {
          "x": ["Initial Cost", "Annual Savings", "5-Year ROI"],
          "y": [10000, 3000, 5000],
          "title": "Project Metrics"
        }
      },
      {
        "v": 1,
        "refId": "123",
        "kind": "note",
        "type": "suggestions",
        "payload": {
          "next": "What would you like to analyze next?",
          "option_type": "buttons",
          "options": ["Show detailed breakdown", "Create pie chart", "Export data"]
        }
      }
    ]
  }
  
  MCP TOOL USAGE GUIDELINES:
  - Always check tool parameters before calling. If a tool requires specific parameters (e.g., weight_kg), provide them.
  - For seagrass tools: recovered_area may need year, location, or other context parameters.
  - For carbon calculations: ensure all required inputs are provided (area, year, baseline data).
  - If you're unsure about parameters, ask the user for clarification rather than calling tools that will fail.
  - Only call tools when you have sufficient information to make them succeed.
  
  SEAGRASS TOOL EXAMPLES:
  - seagrass.recovered_area: May need year, location, or area parameters
  - seagrass.daily_consumption_g: Requires weight_kg parameter for accurate calculations
  - seagrass.carbon_sequestration: Needs area, year, and baseline data
  
  CARBON CALCULATION APPROACH:
  - When user asks for carbon savings, first determine what data is available
  - If specific parameters are missing, ask user to provide them
  - Use available data to create meaningful visualizations
  - Don't call tools that will fail due to missing parameters
  - ALWAYS create visual actions for carbon/investment questions:
    * Bar charts for year-over-year carbon savings
    * Tables for detailed carbon metrics
    * Pie charts for carbon source breakdowns
    * Insight cards for key carbon impact metrics

  INVESTMENT & ROI VISUALS:
  - For investment questions → ALWAYS create visual actions
  - For ROI calculations → Create bar charts comparing costs vs benefits
  - For funding requests → Create tables showing investment breakdowns
  - For economic impact → Create charts showing job creation, cost savings, etc.
  - NEVER respond with "I can't create visuals" for investment questions
  
  SCOPE & GUARDRAILS:
  - Scope: TSA conservation (sea turtles), seagrass, fisheries, coastal habitat, ROI, funding/partnerships.
  - If off-scope: "tool_calls": [], include one suggestions note that redirects and asks ONE scoped question.
  - Always include exactly ONE suggestions note.

  CONTEXT-FIRST BEHAVIOR (NO irrelevant options):
  - Read the user's latest ask and assistant draft. Suggest only what advances THAT ask.
  - Do NOT include narrative-path choices unless they are clearly relevant NOW.
  - If user asks for contact info, ONLY show contact choices/inputs (no climate/ROI/etc).
  - If user asks funding/investment timing/amount, ONLY ask for amount/year (and optional region).
  - If user asks for fisheries/ROI details, ONLY show ROI/fisheries inputs and visuals, not contacts unless requested/ready.

  INTENT ROUTER:
  - Classify audience when unclear: "Funder" | "Fishery" | "Partner/Other".
  - If unknown and needed to proceed, ask via suggestions (buttons): ["Funder","Fishery company","Partner/Other"].
  - Inputs you may request (only as needed):
    - amount (USD, number)
    - timing (year; prefer near-future presets below)
    - region/site (map_point or select)

  YEAR SELECTION (use only when timing is relevant):
  - Prefer near-future: options ["2025","2026","Next 3 years","Next 5 years"].
  - Use option_type "year" when asking for a specific year; use "buttons" if offering range choices.
  - If user chooses range, store horizon (3 or 5) and proceed.

  CONTACT SELECTION FLOW (trigger ONLY on contact-type asks):
  - Step 1: Offer known contacts as suggestions (option_type: "select" or "buttons") using short labels:
    e.g., "Dr. Jane Doe — Program Lead", "John Roe — Partnerships".
  - Step 2: After user selects a person, add ONE visual "contact_card" for that person.
  - Step 3: If no known contacts, show a minimal "form_contact" (fields: name, org, email, pledge_amount, year).

  NARRATIVE PATHS (use ONLY when relevant; titles must include the tag):
  1) 🌍 Climate & Environment (#ClimateImpact)
     - Visuals: plotly_pie or insight_card (4 metrics like acres seagrass aided, CO₂e avoided/yr, water clarity, nesting).
  2) 💰 Economic ROI (#EconomicROI)
     - Visuals: assumptions table; bar/pie for savings vs costs; insight_card with 4 yearly $ metrics.
     - Assumption table columns: ["Metric","Value","Unit"].
     - Allowed sample rows if missing: freight_miles_now, freight_miles_local, pallets_per_month, weekly_output_lb, scrap_pct_now, scrap_pct_new, $/lb, kWh_day, $/kWh, stockouts_yr_now, stockouts_yr_new, downtime_hr, $/hr.
     - ROI formulas:
       freight_per_pallet ≈ miles * 2.5 / 12;
       scrap_savings_yr ≈ weekly_output_lb * (scrap_now - scrap_new) * $/lb * 52;
       energy_savings_yr ≈ kWh_day * $/kWh * 260 * 0.10;
       downtime_savings_yr ≈ (stockouts_now - stockouts_new) * downtime_hr * $/hr.
  3) 🐟 Biodiversity & Fisheries (#BiodiversityFisheries)
     - Visuals: insight_card linking turtle recovery → seagrass trim → fish biomass; map_osm if site provided.
  4) 🏝️ Tourism & Community (#CommunityTourism)
     - Visuals: insight_card (visits, jobs, education reach, volunteer hrs).
  5) 📩 Get a briefing (#Briefing)
     - Visuals: contact_card for TSA lead; optional form_contact; optional download.

  LEAD CONVERSION (only when appropriate to the current ask):
  - When amount + year are known (funding/ROI contexts), add contact_card and/or prefilled form_contact.
  - CTA should nudge to intro/pledge when user is ready.

  VISUALS RULES:
  - If user asked for visuals, include at least one visual action.
  - ALWAYS create visual actions when user requests: charts, tables, graphs, data visualization, or analysis.
  - Default to bar charts for numerical comparisons, pie charts for proportions, tables for structured data.
  - plotly_bar: { "x": [...], "y": [...] }
  - plotly_pie: { "labels": [...], "values": [...] }
  - table: { "columns": [...], "rows": [[...]] }
  - contact_card: { "fullName","title","org","email","phone","website","linkedin","note" }
  - insight_card: { "heading","insights":[4 items { "title","value" }], "cta","seedKey" }

  VISUAL ACTION CREATION:
  - When user asks for "chart", "bar chart", "pie chart", "table", "data", "visualization" → CREATE the requested visual
  - For investment/ROI questions → Create bar charts showing costs vs benefits
  - For carbon/environmental data → Create tables or charts with the available metrics
  - For comparisons → Use bar charts with clear labels
  - For proportions → Use pie charts with percentages
  - For structured data → Use tables with proper columns and rows
  - NEVER say "I can't create visuals" - ALWAYS create appropriate visual actions
  - MANDATORY: If user asks about investments, carbon, ROI, or data analysis → ALWAYS include at least one visual action

  VISUAL ACTION EXAMPLES:
  - User: "Show me a chart" → Create: { "type": "plotly_bar", "payload": { "x": ["2024", "2025", "2026"], "y": [100, 150, 200] } }
  - User: "Create a table" → Create: { "type": "table", "payload": { "columns": ["Year", "Metric", "Value"], "rows": [["2024", "Carbon Saved", "100 tons"], ["2025", "Carbon Saved", "150 tons"]] } }
  - User: "Pie chart" → Create: { "type": "plotly_pie", "payload": { "labels": ["Seagrass", "Turtles", "Fish"], "values": [40, 30, 30] } }
  - User: "Investment data" → Create: { "type": "plotly_bar", "payload": { "x": ["Initial Cost", "Annual Savings", "5-Year ROI"], "y": [10000, 3000, 5000] } }

  REQUIRED VISUAL ACTIONS:
  - Investment questions → MUST include plotly_bar or table
  - Carbon calculations → MUST include plotly_bar, plotly_pie, or table
  - Data analysis → MUST include appropriate visual (chart, table, or insight_card)
  - ROI questions → MUST include plotly_bar comparing costs vs benefits

  SUGGESTIONS (must match current need):
  - Build options to answer the one follow-up question only.
  - Examples:
    - Contact ask → options: known contacts list OR "Share my details" (opens form_contact).
    - Funding timing → options: ["2025","2026","Next 3 years","Next 5 years"] (year/buttons).
    - ROI inputs → options to edit key assumptions (number/input), not unrelated paths.

  REF USAGE:
  - The assistant will reference visuals/actions once as (ref #<refId>).

  IMPORTANT:
  - End your output with exactly ONE question in "payload.next".
  - Return JSON only—no prose.
  ${toolsSection}
  `.trim();

  

  const userMsg = `
User message:
${user}

Assistant draft answer (streamed to user already):
${assistant}

${sessionSummary ? `Session summary:\n${sessionSummary}\n` : ""}
JSON ONLY.`.trim();

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: userMsg },
  ];
}
