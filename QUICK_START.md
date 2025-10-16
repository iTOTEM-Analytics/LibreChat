# Quick Start Guide - iTOTEM Studio in LibreChat

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# In libre/client
cd client
npm install lucide-react clsx @studio-freight/lenis

# In libre/studio-backend
cd ../studio-backend
npm install
```

### 2. Configure Studio Backend

```bash
cd studio-backend
cat > .env << EOF
PORT=3001
MONGODB_URI=mongodb://localhost:27017/studio
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
EOF
```

### 3. Start All Services

```bash
# Terminal 1: LibreChat
cd libre
npm run dev

# Terminal 2: Studio Backend
cd libre/studio-backend
npm run dev

# Ensure MongoDB is running
# mongod --dbpath /path/to/data
```

### 4. Access the Application

Open http://localhost:3000/

## 📍 Key URLs

| URL | Description | Access |
|-----|-------------|--------|
| http://localhost:3000/ | Studio Landing Page | Public |
| http://localhost:3000/login | Login | Public |
| http://localhost:3000/studio | Studio Dashboard | Protected |
| http://localhost:3000/studio/ldai/chat | LDAI Chat | Protected |
| http://localhost:3000/studio/ldai/admin | LDAI Admin | Protected |
| http://localhost:3000/studio/storyfinder | StoryFinder | Protected |
| http://localhost:3000/c/new | LibreChat | Protected |

## 🎯 What Changed

### New Homepage
- **Before**: LibreChat login screen
- **After**: Studio landing page with "Get Started" button

### Default After Login
- **Before**: Redirects to `/c/new` (chat)
- **After**: Redirects to `/studio` (Studio dashboard)

### What Stayed the Same
- ✅ All LibreChat chat functionality at `/c`
- ✅ LibreChat search at `/search`
- ✅ LibreChat agents at `/agents`
- ✅ LibreChat authentication system
- ✅ All dashboard routes at `/d`

## 🔄 Navigation Flow

```
Homepage (/)
    ↓
[Get Started / Sign In]
    ↓
Login (/login)
    ↓
Studio Dashboard (/studio)
    ├─→ LDAI (/studio/ldai/*)
    ├─→ StoryFinder (/studio/storyfinder/*)
    └─→ LibreChat (/c/new) ← Click "LibreChat" in sidebar
```

## 📂 Project Structure

```
libre/
├── client/src/components/Studio/   ← All Studio UI components
├── client/src/routes/Studio/       ← Studio routing
├── studio-backend/                 ← Independent API (port 3001)
└── studio-mcp/                     ← MCP servers for LDAI
```

## 🔧 Common Commands

```bash
# Start LibreChat
npm run dev

# Start Studio Backend
cd studio-backend && npm run dev

# Build for production
npm run build

# Studio Backend production
cd studio-backend && npm run build && npm start
```

## 🐛 Troubleshooting

### Studio pages not loading?
- Check if studio-backend is running on port 3001
- Check browser console for errors
- Verify `VITE_STUDIO_API_URL` is set

### Can't access LibreChat?
- LibreChat is still at `/c/new`
- Click "LibreChat" in the Studio sidebar
- All original features are preserved

### Login not working?
- Uses LibreChat's existing auth
- No separate Studio login needed
- Check LibreChat API is running

### MCP servers not working?
- Only needed for LDAI features
- Usually auto-started by studio-backend
- Check studio-backend logs

## 📖 More Information

- **Full Integration Guide**: `STUDIO_INTEGRATION.md`
- **Migration Details**: `MIGRATION_SUMMARY.md`
- **Backend Setup**: `studio-backend/README.md`
- **MCP Servers**: `studio-mcp/README.md`

## ✅ Quick Verification

After starting, verify:
- [ ] Homepage shows Studio landing page
- [ ] Can login using LibreChat auth
- [ ] After login, see Studio dashboard
- [ ] Can access LDAI from dashboard
- [ ] Can access StoryFinder from dashboard
- [ ] Can access LibreChat from sidebar
- [ ] No console errors

## 🎉 You're Ready!

Everything from iTOTEM Studio is now integrated into LibreChat:
- ✅ Studio landing page as homepage
- ✅ Studio dashboard as default after login
- ✅ All LDAI features
- ✅ All StoryFinder features
- ✅ All LibreChat features (unchanged)
- ✅ Single authentication system
- ✅ Seamless navigation between Studio and LibreChat

**Enjoy your enhanced LibreChat with Studio!**
