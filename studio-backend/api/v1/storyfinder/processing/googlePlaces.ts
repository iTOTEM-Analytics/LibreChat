// backend/api/v1/storyfinder/processing/googlePlaces.ts
const TEXT_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export async function lookupWebsite(name: string, city?: string | null, province?: string | null, apiKey?: string | null) {
  if (!apiKey) return null;
  const query = [name, city || "", province || ""].filter(Boolean).join(", ");

  try {
    const ts = new URL(TEXT_URL);
    ts.searchParams.set("query", query);
    ts.searchParams.set("key", apiKey);
    const tResp = await fetch(ts.toString());
    const tJson = await tResp.json();
    const place = tJson?.results?.[0];
    const placeId = place?.place_id;
    if (!placeId) return null;

    const dt = new URL(DETAILS_URL);
    dt.searchParams.set("place_id", String(placeId));
    dt.searchParams.set("fields", "website,url");
    dt.searchParams.set("key", apiKey);
    const dResp = await fetch(dt.toString());
    const dJson = await dResp.json();
    const website = dJson?.result?.website || null;
    return website;
  } catch {
    return null;
  }
}
