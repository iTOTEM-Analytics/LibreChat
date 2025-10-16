// backend/api/v1/storyfinder/processing/preprocess.ts
import { InitialRow, StartRunBody } from "../types";
import { lookupWebsite } from "./googlePlaces";

function pick<T>(obj: any, k: string | undefined | null): T | null {
  if (!k) return null;
  const v = obj?.[k];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return (s.length ? (s as any) : null);
}

function normalizeRow(
  raw: any,
  vendorCol?: string | null,
  cityCol?: string | null,
  provinceCol?: string | null
): InitialRow {
  const name =
    pick<string>(raw, vendorCol || "vendor") ||
    pick<string>(raw, "name") ||
    pick<string>(raw, "supplier") ||
    "";
  const city = pick<string>(raw, cityCol || "city");
  const province =
    pick<string>(raw, provinceCol || "province") ||
    pick<string>(raw, "state") ||
    pick<string>(raw, "region");

  // indigenous flags
  const ind =
    pick<string>(raw, "ind_status_final") ||
    pick<string>(raw, "ind_status") ||
    pick<string>(raw, "indigenous") ||
    pick<string>(raw, "nation");

  const isInd =
    ind &&
    /^(yes|true|indigenous|affiliated|y)$/i.test(String(ind).toLowerCase());

  // spend (numeric best-effort)
  const spendRaw =
    raw["spend"] ??
    raw["total_spend"] ??
    raw["annual_spend"] ??
    raw["amount"] ??
    null;
  const spend =
    spendRaw === null || spendRaw === undefined
      ? null
      : Number(String(spendRaw).replace(/[^0-9.]/g, "")) || null;

  const nation =
    pick<string>(raw, "nation") || pick<string>(raw, "first_nation") || null;

  return {
    vendor_name: String(name),
    city: city ? String(city) : null,
    province: province ? String(province) : null,
    indigenous_flag: !!isInd || null,
    nation,
    spend,
    google_api_website: null,
  };
}

function sortRows(rows: InitialRow[], bias?: string | null): InitialRow[] {
  const biasProvince = bias?.split(",")?.pop()?.trim()?.toLowerCase() || null;
  return rows
    .slice()
    .sort((a, b) => {
      // 1) indigenous true first
      const ai = a.indigenous_flag ? 1 : 0;
      const bi = b.indigenous_flag ? 1 : 0;
      if (ai !== bi) return bi - ai;

      // 2) has nation
      const an = a.nation ? 1 : 0;
      const bn = b.nation ? 1 : 0;
      if (an !== bn) return bn - an;

      // 3) spend in middle (simulate Q2-ish)
      const aMid = a.spend ? Math.abs(a.spend - 50000) : 1e12;
      const bMid = b.spend ? Math.abs(b.spend - 50000) : 1e12;
      if (aMid !== bMid) return aMid - bMid;

      // 4) bias province match
      const am = (a.province || "").toLowerCase() === biasProvince ? 1 : 0;
      const bm = (b.province || "").toLowerCase() === biasProvince ? 1 : 0;
      if (am !== bm) return bm - am;

      // 5) higher spend
      const as = a.spend ?? -1;
      const bs = b.spend ?? -1;
      return bs - as;
    });
}

export async function buildAndSortInitialDF(body: StartRunBody): Promise<InitialRow[]> {
  // Check if we have manual vendors in meta or source, and if so, treat this as manual mode
  const hasManualVendors = (body.meta?.manual && body.meta.manual.length > 0) || 
                           (body.source.manual && body.source.manual.length > 0);
  const mode = hasManualVendors ? "manual" : body.source.mode;

  console.log("🔍 Processing mode:", mode, "hasManualVendors:", hasManualVendors);
  console.log("📋 Source mode:", body.source.mode, "Meta manual:", body.meta?.manual, "Source manual:", body.source.manual);

  let rows: InitialRow[] = [];
  if (mode === "manual") {
    // Manual vendors can be stored in either meta.manual or source.manual
    const manualVendors = body.meta?.manual || body.source.manual || [];
    console.log("🔄 Processing manual vendors:", manualVendors);
    rows = manualVendors.map((m) => {
      // Parse location from the format "City, Province" or just "City"
      let city: string | null = null;
      let province: string | null = null;
      
      if (m.location) {
        const locationParts = m.location.split(",").map(part => part.trim());
        city = locationParts[0] || null;
        province = locationParts[1] || null;
        console.log(`📍 Parsed location for ${m.name}: city="${city}", province="${province}"`);
      }
      
      const row = {
        vendor_name: m.name,
        city,
        province,
        indigenous_flag: null,
        nation: null,
        spend: null,
        google_api_website: null,
      };
      console.log(`✅ Created row for ${m.name}:`, row);
      return row;
    });
    console.log(`📊 Total manual vendor rows created: ${rows.length}`);
  } else {
    const vendorCol = body.source.vendorCol;
    const cityCol = body.source.cityCol;
    const provinceCol = body.source.provinceCol;
    rows = (body.source.rows || []).map((r) =>
      normalizeRow(r, vendorCol, cityCol, provinceCol)
    );
  }

  // Google Places enrichment (optional)
  const gKey = process.env.GOOGLE_PLACES_API_KEY || null;
  if (gKey) {
    console.log("🔍 Starting Google Places enrichment for", rows.length, "vendors");
    console.log("🔑 Google Places API key available:", !!gKey);
    
    const limit = 3; // small concurrency
    let i = 0;
    async function worker() {
      while (i < rows.length) {
        const idx = i++;
        const r = rows[idx];
        console.log(`🔍 Looking up website for: ${r.vendor_name} (${r.city || 'no city'}, ${r.province || 'no province'})`);
        const site = await lookupWebsite(r.vendor_name, r.city, r.province, gKey);
        rows[idx] = { ...r, google_api_website: site || null };
        console.log(`✅ Website lookup result for ${r.vendor_name}: ${site || 'not found'}`);
      }
    }
    await Promise.all(Array.from({ length: limit }, worker));
    console.log("✅ Google Places enrichment completed");
  } else {
    console.log("⚠️ No Google Places API key found, skipping website enrichment");
    console.log("💡 Set GOOGLE_PLACES_API_KEY environment variable to enable website lookup");
  }

  // Final sort, then move ones with website to top (stable)
  const sorted = sortRows(rows, body.locationBias || null);
  const withSite = sorted.filter((r) => !!r.google_api_website);
  const withoutSite = sorted.filter((r) => !r.google_api_website);
  
  const finalRows = [...withSite, ...withoutSite];
  console.log("📊 Final processing results:");
  console.log(`   Total rows: ${finalRows.length}`);
  console.log(`   With website: ${withSite.length}`);
  console.log(`   Without website: ${withoutSite.length}`);
  console.log("   Sample rows:", finalRows.slice(0, 3).map(r => ({ name: r.vendor_name, city: r.city, province: r.province, website: r.google_api_website })));
  
  return finalRows;
}
