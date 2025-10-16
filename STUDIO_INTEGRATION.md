| Route               | Description                            |
| ------------------- | -------------------------------------- |
| /                   | Studio landing page (new homepage)     |
| /studio             | Studio dashboard (default after login) |
| /studio/ldai/chat   | LDAI chat interface                    |
| /studio/ldai/admin  | LDAI admin panel                       |
| /studio/storyfinder | StoryFinder application                |
| /c/:conversationId? | LibreChat (preserved)                  |
| /search             | LibreChat search (preserved)           |
| /agents             | LibreChat agents (preserved)           |

### 1. Frontend (Client)

Located in: `client/src/components/Studio/`

**Structure:**

```
client/src/
├── components/
│   └── Studio/
│       ├── StudioLanding.tsx          # New homepage (before login)
│       ├── StudioDashboard.tsx        # Studio dashboard (after login)
│       ├── Landing/                   # Landing page components
│       ├── Layout/                    # Studio layout wrapper
│       ├── applications/
│       │   ├── LDAI/                  # LDAI chat application
│       │   └── StoryFinder/           # StoryFinder application
│       ├── api/                       # API client utilities
│       └── types/                     # TypeScript types
├── routes/
│   └── Studio/
│       ├── index.tsx                  # Studio routes configuration
│       └── StudioRoute.tsx            # Studio route wrapper
└── hooks/
    └── useLenis.ts                    # Smooth scroll hook
```

**Routes:**

- `/` - Studio landing page (public, new homepage)
- `/studio` - Studio dashboard (protected, default after login)
- `/studio/ldai/chat` - LDAI chat interface
- `/studio/ldai/admin` - LDAI admin panel
- `/studio/storyfinder` - StoryFinder projects list
- `/studio/storyfinder/:id` - StoryFinder project details
- `/studio/storyfinder/:id/candidate/:cid` - Candidate profile
- `/studio/storyfinder/:id/candidate/:cid/story` - Generated story
- `/studio/storyfinder/:id/candidate/:cid/story/edit` - Story editor

### 2. Backend (studio-backend)

Located in: `studio-backend/`

An independent Node.js/Express backend that runs alongside LibreChat's main API.

**Structure:**

```
studio-backend/
├── api/
│   └── v1/
│       ├── ldai/
│       │   ├── chat.routes.ts
│       │   ├── chat.service.ts
│       │   ├── knowledge.routes.ts
│       │   ├── knowledge.service.ts
│       │   ├── mcp.routes.ts
│       │   └── mcp.service.ts
│       └── storyfinder/
│           ├── projects.routes.ts
│           ├── projects.service.ts
│           ├── candidates.routes.ts
│           └── candidates.service.ts
├── db/                                # Database models
├── llm/                               # LLM utilities
├── middleware/                        # Express middleware
└── index.ts                           # Server entry point
```

**Default Port:** 3001

### 3. MCP Servers (studio-mcp)

Located in: `studio-mcp/`

Python-based Model Context Protocol servers providing specialized tools for LDAI:

- `fish_mcp/` - Fish sustainability data
- `impact_mcp/` - Impact assessment tools
- `seagrass_mcp/` - Seagrass restoration data

## Setup Instructions

### 1. Install Frontend Dependencies

The Studio components are already copied into the client. You may need to install additional dependencies:

```bash
cd client
npm install lucide-react clsx @studio-freight/lenis
```

### 2. Set Up Studio Backend

```bash
cd studio-backend
npm install

# Create .env file
cat > .env << EOF
PORT=3001
MONGODB_URI=mongodb://localhost:27017/studio
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
EOF

# Start the backend
npm run dev
```

### 3. Set Up MCP Servers (Optional)

Only needed if using LDAI application:

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Set up each MCP server
cd studio-mcp/fish_mcp
uv venv
source .venv/bin/activate
uv pip install -e .
cd ../..

# Repeat for impact_mcp and seagrass_mcp
```

### 4. Configure LibreChat Client

Add Studio API URL to your environment:

```bash
# In client/.env or root .env
VITE_STUDIO_API_URL=http://localhost:3001
```

### 5. Start All Services

```bash
# Terminal 1: LibreChat (main API and client)
npm run dev

# Terminal 2: Studio Backend
cd studio-backend
npm run dev

# Terminal 3: MCP Servers (if using LDAI)
# These are typically auto-started by studio-backend
```

## Authentication Integration

Studio uses LibreChat's existing authentication system:

- Login, registration, and password reset use LibreChat's Auth components
- No separate authentication is needed for Studio
- After login, users are redirected to `/studio` instead of `/c/new`
- Studio routes are protected using LibreChat's `AuthContext`

## Key Changes to LibreChat

### Modified Files

1. **client/src/routes/index.tsx**

   - Added `studioRoutes` import and registration
   - Changed root path (`/`) to show `StudioLanding`
   - Changed default redirect after login from `/c/new` to `/studio`
   - Reorganized auth routes (register, forgot-password, reset-password)

2. **client/src/hooks/useLenis.ts** (copied from Studio)
   - Smooth scrolling for landing page

### New Files/Directories

1. **client/src/components/Studio/** - All Studio components
2. **client/src/routes/Studio/** - Studio routing configuration
3. **studio-backend/** - Independent backend service
4. **studio-mcp/** - MCP servers for LDAI

## API Communication

The Studio frontend communicates with two backends:

1. **LibreChat API** (port 3080) - For authentication, user management
2. **Studio Backend** (port 3001) - For LDAI and StoryFinder features

API calls in Studio components use the base URL from `VITE_STUDIO_API_URL`.

## Database

Studio Backend uses its own MongoDB database (default: `studio`), separate from LibreChat's database. Collections:

- `ldai_chats` - Chat history
- `ldai_knowledge` - Knowledge base files
- `storyfinder_projects` - Story projects
- `storyfinder_candidates` - Candidate profiles

## Development Workflow

### Adding New Studio Features

1. Add components in `client/src/components/Studio/applications/[app-name]/`
2. Add routes in `client/src/routes/Studio/index.tsx`
3. Add backend routes in `studio-backend/api/v1/[app-name]/`
4. Update database models if needed

### Testing

```bash
# Test frontend
cd client
npm run test

# Test studio-backend
cd studio-backend
npm run test

# Integration testing
# Navigate to http://localhost:3000/studio after login
```

## Deployment

### Production Build

```bash
# Build LibreChat client (includes Studio)
npm run build

# Build Studio Backend
cd studio-backend
npm run build
npm start
```

### Environment Variables

**Client:**

```env
VITE_STUDIO_API_URL=https://studio-api.yourdomain.com
```

**Studio Backend:**

```env
PORT=3001
MONGODB_URI=mongodb://your-mongo-server:27017/studio
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
NODE_ENV=production
```

### Docker (Future Enhancement)

Consider adding Studio Backend to your docker-compose:

```yaml
studio-backend:
  build: ./studio-backend
  ports:
    - '3001:3001'
  environment:
    - MONGODB_URI=mongodb://mongo:27017/studio
    - OPENAI_API_KEY=${OPENAI_API_KEY}
  depends_on:
    - mongo
```

## Accessing Studio

1. **Before Login:** Visit http://localhost:3000/ to see the Studio landing page
2. **Click "Get Started" or "Sign In"** to go to login
3. **After Login:** Automatically redirected to `/studio` dashboard
4. **Access Applications:**
   - Click "LDAI (Local Data AI)" to use the chat interface
   - Click "Story Finder" to generate candidate stories

## Troubleshooting

### Studio Backend Not Responding

- Check if the backend is running on port 3001
- Verify MongoDB is running
- Check `studio-backend/.env` configuration

### MCP Servers Not Working

- Ensure Python virtual environments are activated
- Check that all MCP servers are installed correctly
- Review studio-backend logs for MCP connection errors

### Routing Issues

- Clear browser cache and local storage
- Verify `client/src/routes/index.tsx` has studio routes imported
- Check browser console for routing errors

## Migration Notes

This integration was created by copying all pages and functionality from `itotem-studio` to `libre`, with the following exclusions:

- ✅ Copied: All application pages (LDAI, StoryFinder)
- ✅ Copied: Landing page components (now LibreChat homepage)
- ✅ Copied: Studio dashboard
- ✅ Copied: Backend API and database logic
- ✅ Copied: MCP servers
- ❌ Not copied: Login, registration, password reset pages (using LibreChat's existing auth)

## Support

For issues related to:

- **Studio Applications:** Check `studio-backend/` logs
- **LibreChat Integration:** Check main LibreChat documentation
- **MCP Servers:** See `studio-mcp/README.md`

## Future Enhancements

- [ ] Add Docker support for Studio Backend
- [ ] Implement user permissions for Studio apps
- [ ] Add Studio-specific settings in LibreChat UI
- [ ] Create admin panel for managing Studio features
- [ ] Add analytics and usage tracking
