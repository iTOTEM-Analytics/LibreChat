from mcp.server.fastmcp import FastMCP

mcp = FastMCP("impact")

@mcp.tool()
def estimate_turtles(amount: float, years: int = 2) -> dict:
    """
    Estimate the number of sea turtles that can be supported by a given amount of investment.
    Returns: {"value": int, "units": "turtles", "years": int}
    """
    c = 400.0
    growth = 1.0 + 0.10 * max(0, years - 1)
    turtles = int((amount / c) * growth)
    return {"value": turtles, "units": "turtles", "years": years}

@mcp.tool()
def benefits_table(amount: float, years: int = 2) -> dict:
    """
    Estimate the benefits of a given amount of investment in sea turtles.
    Returns: {"columns": ["Benefit", "Value", "Units"], "rows": [["Sea turtles protected", turtles, "turtles"], ["Seagrass area recovered", seagrass_hectares, "hectares"], ["Fish stock increase", fish_pct, "%"]], "title": f"Benefits from ${int(amount):,} over {years}y"}
    """
    c = 400.0
    growth = 1.0 + 0.10 * max(0, years - 1)
    turtles = int((amount / c) * growth)
    seagrass_hectares = round(amount * 0.0008, 2)
    fish_pct = round(min(20.0, 1.5 + (amount/10000.0)*2 + max(0, years-1)*0.5), 1)
    return {
        "columns": ["Benefit", "Value", "Units"],
        "rows": [
            ["Sea turtles protected", turtles, "turtles"],
            ["Seagrass area recovered", seagrass_hectares, "hectares"],
            ["Fish stock increase", fish_pct, "%"],
        ],
        "title": f"Benefits from ${int(amount):,} over {years}y",
    }

@mcp.tool()
def classify_habitat_by_scl(scl_cm: float) -> dict:
    """
    Category from straight carapace length (cm).
    Returns: {"value": str, "units": "category", "scl_cm": float}
    """
    x = float(scl_cm)
    if x < 20: cat = "Oceanic"
    elif x < 30: cat = "Recruit"
    elif x < 40: cat = "Transitional"
    else: cat = "Inshore"
    return {"value": cat, "units": "category", "scl_cm": scl_cm}

@mcp.tool()
def estimate_weight_from_scl(scl_cm: float) -> dict:
    """
    Turtle weight from SCL using polynomial (kg).
    Returns: {"value": float, "units": "kg", "scl_cm": float}
    """
    x = float(scl_cm)
    w = 0.06605 + (-0.0134)*x + (0.00106)*(x**2) + (4.7e-4)*(x**3) + (-5.03573e-8)*(x**4)
    return {"value": round(max(0.0, w), 3), "units": "kg", "scl_cm": scl_cm}

@mcp.tool()
def supported_individuals_per_year(area_hectares: float, density_per_hectare: float, lifetime_years: float) -> dict:
    """
    Individuals supported per year by habitat area.
    Returns: {"value": int, "units": "individuals/year"}
    """
    val = int(max(0.0, area_hectares) * max(0.0, density_per_hectare) / max(1e-9, lifetime_years))
    return {"value": val, "units": "individuals/year"}

@mcp.tool()
def market_value(count: int, weight_lb: float, price_per_lb: float) -> dict:
    """
    Dollar value from count, lb/animal, and $/lb.
    Returns: {"value": float, "units": "$"}
    """
    v = round(max(0, int(count)) * max(0.0, weight_lb) * max(0.0, price_per_lb), 2)
    return {"value": v, "units": "$"}

if __name__ == "__main__":
    import argparse, json, sys, asyncio, inspect
    p = argparse.ArgumentParser()
    p.add_argument("--list", action="store_true")
    p.add_argument("--once")
    p.add_argument("--json")
    args = p.parse_args()

    if args.list:
        print(json.dumps({"tools": [
            "estimate_turtles",
            "benefits_table",
            "classify_habitat_by_scl",
            "estimate_weight_from_scl",
            "supported_individuals_per_year",
            "market_value",
        ]}))
        sys.exit(0)

    if args.once:
        params = json.loads(args.json or "{}")
        name = args.once
        try:
            out = {
                "estimate_turtles": estimate_turtles,
                "benefits_table": benefits_table,
                "classify_habitat_by_scl": classify_habitat_by_scl,
                "estimate_weight_from_scl": estimate_weight_from_scl,
                "supported_individuals_per_year": supported_individuals_per_year,
                "market_value": market_value,
            }[name](**params)
            print(json.dumps(out))
            sys.exit(0)
        except KeyError:
            print(json.dumps({"error": "unknown tool"}))
            sys.exit(2)

    rv = mcp.run()
    if inspect.iscoroutine(rv):
        asyncio.run(rv)
