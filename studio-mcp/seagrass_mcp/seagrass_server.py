from mcp.server.fastmcp import FastMCP

mcp = FastMCP("seagrass")

@mcp.tool()
def recovered_area(amount: float, efficiency: float = 0.0008) -> dict:
    """
    Estimate hectares of seagrass recovered for a given budget.
    Returns: {"value": float, "units": "hectares", "efficiency": float}
    """
    area = round(amount * efficiency, 2)
    return {"value": area, "units": "hectares", "efficiency": efficiency}

@mcp.tool()
def daily_consumption_g(weight_kg: float) -> dict:
    """
    Seagrass consumption by turtle weight (g/day).
    Returns: {"value": int, "units": "g/day"}
    """
    w = float(weight_kg)
    if w < 8: v = 24
    elif w < 30: v = 82
    elif w < 48: v = 177
    else: v = 218
    return {"value": int(v), "units": "g/day"}

@mcp.tool()
def required_area_for_turtle(weight_kg: float, category: str, biomass_per_hectare_kg: float = 5000.0) -> dict:
    """
    Hectares needed to support one turtle for a year.
    Returns: {"value": float, "units": "hectares", "category": str}
    """
    c = (category or "").strip().lower()
    iri = {"inshore": 0.837, "transitional": 0.512, "recruit": 0.22, "oceanic": 0.031}.get(c, 0.031)
    # food() approx from notebook (g/day) -> kg/year
    w = float(weight_kg)
    if w < 8: cons_g_day = 24
    elif w < 30: cons_g_day = 82
    elif w < 48: cons_g_day = 177
    else: cons_g_day = 218
    cons_kg_year = (cons_g_day / 1000.0) * 365.0
    area = cons_kg_year * iri / max(1e-9, biomass_per_hectare_kg)
    return {"value": round(area, 4), "units": "hectares", "category": category, "biomass_per_ha_kg": biomass_per_hectare_kg}

if __name__ == "__main__":
    import asyncio, inspect
    rv = mcp.run()
    if inspect.iscoroutine(rv):
        asyncio.run(rv)
