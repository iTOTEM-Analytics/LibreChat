# Studio MCP Servers

This directory contains Model Context Protocol (MCP) servers for iTOTEM Studio applications integrated into LibreChat.

## Overview

MCP servers provide specialized tools and data sources for the LDAI (Local Data AI) application. Each server focuses on a specific domain:

- **fish_mcp**: Fish sustainability and aquaculture data
- **impact_mcp**: Environmental and social impact assessment tools
- **seagrass_mcp**: Seagrass restoration and marine habitat data

## MCP Server Structure

Each MCP server is a Python-based service that implements the Model Context Protocol standard, allowing it to be discovered and used by LLM-powered applications.

```
studio-mcp/
├── fish_mcp/
│   ├── src/
│   │   └── fish_mcp/
│   │       └── server.py
│   ├── pyproject.toml
│   └── README.md
├── impact_mcp/
│   ├── src/
│   │   └── impact_mcp/
│   │       └── server.py
│   ├── pyproject.toml
│   └── README.md
└── seagrass_mcp/
    ├── src/
    │   └── seagrass_mcp/
    │       └── server.py
    ├── pyproject.toml
    └── README.md
```

## Setup

### Prerequisites

- Python 3.10 or higher
- pip or uv package manager

### Installation

For each MCP server, you need to create a virtual environment and install dependencies:

#### Using Python venv:

```bash
# For fish_mcp
cd fish_mcp
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .
```

#### Using uv (recommended):

```bash
# For fish_mcp
cd fish_mcp
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

Repeat for `impact_mcp` and `seagrass_mcp`.

## Running MCP Servers

MCP servers are typically started automatically by the Studio Backend when needed. However, you can also run them manually for testing:

```bash
cd fish_mcp
python -m fish_mcp
```

## MCP Server Details

### fish_mcp

Provides tools and data related to:
- Fish species information
- Aquaculture sustainability metrics
- Fishing zone data
- Marine biodiversity indicators

### impact_mcp

Offers capabilities for:
- Environmental impact assessment
- Social impact evaluation
- Sustainability scoring
- Regulatory compliance checking

### seagrass_mcp

Supplies information about:
- Seagrass restoration projects
- Marine habitat health monitoring
- Coastal ecosystem data
- Conservation strategies

## Configuration

MCP servers can be configured through environment variables or configuration files within each server directory. Check individual server READMEs for specific configuration options.

## Integration with Studio Backend

The Studio Backend (`../studio-backend`) integrates these MCP servers through the `@modelcontextprotocol/sdk` package. The backend:

1. Discovers available MCP servers
2. Starts them as needed
3. Routes LLM tool calls to appropriate MCP servers
4. Aggregates responses for the LDAI chat interface

## Development

To add a new MCP server:

1. Create a new directory following the naming pattern `[name]_mcp`
2. Set up Python project structure with `pyproject.toml`
3. Implement the MCP server in `src/[name]_mcp/server.py`
4. Add tools and resources following MCP specification
5. Update the Studio Backend to recognize the new server

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

## License

Same as LibreChat parent project
