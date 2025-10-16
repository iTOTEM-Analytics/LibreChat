from mcp.server.fastmcp import FastMCP

mcp = FastMCP("fish")

@mcp.tool()
def recovery(amount: float, years: int = 2) -> dict:
    """
    Estimate percent recovery of fish stock.
    Returns: {"value": float, "units": "%", "years": int}
    """
    pct = 1.5 + (amount / 10000.0) * 2.0 + max(0, years - 1) * 0.5
    pct = min(20.0, pct)
    return {"value": round(pct, 1), "units": "%", "years": years}

@mcp.tool()
def iri_factor(category: str) -> dict:
    """
    Map habitat category to IRI factor.
    Returns: {"value": float, "units": "factor", "category": str}
    """
    c = (category or "").strip().lower()
    lut = {"inshore": 0.837, "transitional": 0.512, "recruit": 0.22, "oceanic": 0.031}
    v = lut.get(c, lut["oceanic"])
    return {"value": v, "units": "factor", "category": category}

@mcp.tool()
def estimate_population_growth(area_hectares: float, growth_rate_per_hectare: float) -> dict:
    """
    Individuals added per year from habitat area.
    Returns: {"value": int, "units": "individuals/year", "area_hectares": float, "growth_rate_per_ha": float}
    """
    val = int(max(0.0, area_hectares) * max(0.0, growth_rate_per_hectare))
    return {"value": val, "units": "individuals/year", "area_hectares": area_hectares, "growth_rate_per_ha": growth_rate_per_hectare}

@mcp.tool()
def growth_index(weight_kg: float, category: str = "Inshore") -> dict:
    """
    Simple growth index using weight and IRI factor.
    Returns: {"value": float, "units": "index", "category": str}
    """
    lut = {"inshore": 0.837, "transitional": 0.512, "recruit": 0.22, "oceanic": 0.031}
    f = lut.get((category or "").strip().lower(), 0.031)
    idx = round(max(0.0, weight_kg) * f * 0.5, 3)
    return {"value": idx, "units": "index", "category": category}

if __name__ == "__main__":
    import asyncio, inspect
    rv = mcp.run()
    if inspect.iscoroutine(rv):
        asyncio.run(rv)
