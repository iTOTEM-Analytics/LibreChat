# Studio Backend

This is the independent backend service for iTOTEM Studio applications (LDAI and StoryFinder), integrated into LibreChat.

## Overview

The Studio Backend provides API endpoints for:
- **LDAI (Local Data AI)**: Agentic chat interface with regional intelligence
- **StoryFinder**: Insightful story generator for candidate profiling
- **MCP Integration**: Model Context Protocol server support

## Project Structure

```
studio-backend/
├── api/
│   └── v1/
│       ├── ldai/          # LDAI endpoints and services
│       └── storyfinder/   # StoryFinder endpoints and services
├── db/                    # Database models and migrations
├── llm/                   # LLM integration utilities
├── middleware/            # Express middleware
├── index.ts              # Main server entry point
└── package.json          # Dependencies and scripts
```

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running instance)
- OpenAI API key or compatible LLM endpoint

### Installation

1. Navigate to the studio-backend directory:
   ```bash
   cd studio-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/studio
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

4. Start the server:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### LDAI Endpoints

- `POST /api/v1/ldai/chat` - Send chat messages
- `GET /api/v1/ldai/knowledge` - Retrieve knowledge base
- `POST /api/v1/ldai/knowledge` - Upload knowledge files
- `GET /api/v1/ldai/mcp` - MCP server integration

### StoryFinder Endpoints

- `GET /api/v1/storyfinder/projects` - List all projects
- `POST /api/v1/storyfinder/projects` - Create new project
- `GET /api/v1/storyfinder/projects/:id` - Get project details
- `GET /api/v1/storyfinder/candidates` - List candidates
- `POST /api/v1/storyfinder/candidates` - Add candidate

## Database

The backend uses MongoDB for data persistence. Collections include:
- `ldai_chats` - Chat history and context
- `ldai_knowledge` - Uploaded knowledge base files
- `storyfinder_projects` - Story projects
- `storyfinder_candidates` - Candidate profiles

## Integration with LibreChat

The Studio Backend runs as an independent service alongside LibreChat's main API. The frontend routes are configured to communicate with this backend on port 3001 (default).

Update the frontend API configuration to point to:
```
VITE_STUDIO_API_URL=http://localhost:3001
```

## MCP Server Support

The backend integrates with Model Context Protocol (MCP) servers located in `../studio-mcp/`:
- `fish_mcp` - Fish sustainability data
- `impact_mcp` - Impact assessment tools
- `seagrass_mcp` - Seagrass restoration data

## Development

To develop new features:

1. Add routes in `api/v1/[application]/`
2. Implement services in corresponding `.service.ts` files
3. Update database models in `db/`
4. Test endpoints using Postman or curl

## License

Same as LibreChat parent project
