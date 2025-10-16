import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlignJustify,
  LayoutDashboard,
  MessageSquareDot,
  CirclePlus,
  Settings,
  ChevronDown,
  ChevronUp,
  FileSearch,
  MessagesSquare
} from "lucide-react";


export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [ldarOpen, setLdarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    if (isActive("/ldai")) setLdarOpen(true);
  }, [location]);

  const handleSettingsClick = () => {
    alert("Settings modal stub");
  };

  const handleLdarClick = () => {
    setLdarOpen((prev) => !prev);
    navigate("/ldai/admin");
  };

  return (
    <aside
      className={`bg-white shadow transition-all duration-50 ${
        collapsed ? "w-20" : "w-64"
      } h-full flex flex-col justify-between`}
    >
      {/* Main nav */}
      <div className="py-4 flex-1 overflow-y-auto">
        <nav className="space-y-2">
          {/* Studio Dashboard */}
          <Link
            to="/studio"
            className={`flex items-center gap-3 py-2 px-4 transition cursor-pointer ${
              location.pathname === "/studio"
                ? "text-black font-semibold"
                : "text-gray-700 hover:text-teal-800"
            }`}
            title="Studio Dashboard"
          >
            <LayoutDashboard size={22} />
            {!collapsed && <span>Studio Dashboard</span>}
          </Link>

          {/* LDAI */}
          <button
            onClick={handleLdarClick}
            className={`flex items-center gap-3 w-full py-2 px-4 transition cursor-pointer ${
              isActive("/ldai")
                ? "text-black font-semibold"
                : "text-gray-700 hover:text-teal-800"
            }`}
            title="LDAR"
          >
            <MessageSquareDot size={22} />
            {!collapsed && (
              <>
                <span>LDAI</span>
                <span className="ml-auto">
                  {ldarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </>
            )}
          </button>

          {/* LDAR Submenu */}
          {!collapsed && ldarOpen && (
            <div className="ml-10 mt-1 space-y-1">
              <Link
                to="/ldai/admin"
                className={`flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded ${
                  location.pathname === "/ldai/admin"
                    ? "text-black font-semibold"
                    : "text-gray-600 hover:text-teal-800"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Admin Panel</span>
              </Link>
              <Link
                to="/ldai/chat"
                className={`flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded ${
                  location.pathname === "/ldai/chat"
                    ? "text-black font-semibold"
                    : "text-gray-600 hover:text-teal-800"
                }`}
              >
                <CirclePlus size={16} />
                <span>New Chat</span>
              </Link>
            </div>
          )}
          {/* Story Finder */}
          <Link
            to="/storyfinder"
            className={`flex items-center gap-3 py-2 px-4 transition cursor-pointer ${
              isActive("/storyfinder")
                ? "text-black font-semibold"
                : "text-gray-700 hover:text-teal-800"
            }`}
            title="Story Finder"
          >
            <FileSearch size={22} />
            {!collapsed && <span>Story Finder</span>}
          </Link>

          {/* Divider */}
          {!collapsed && <div className="border-t border-gray-200 my-2 mx-4"></div>}

          {/* LibreChat */}
          <Link
            to="/c/new"
            className={`flex items-center gap-3 py-2 px-4 transition cursor-pointer ${
              isActive("/c")
                ? "text-black font-semibold"
                : "text-gray-700 hover:text-teal-800"
            }`}
            title="LibreChat"
          >
            <MessagesSquare size={22} />
            {!collapsed && <span>LibreChat</span>}
          </Link>
        </nav>
      </div>

      {/* Settings + Collapse */}
      <div className="relative px-3 pb-4">
        <button
          onClick={handleSettingsClick}
          className="flex items-center gap-3 w-full text-gray-700 text-sm cursor-pointer hover:text-teal-800"
          title="Settings"
        >
          <Settings size={22} />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-3 right-1 border text-sm px-1 rounded-sm border-gray-200 text-gray-300 hover:border-teal-800 hover:text-teal-800 bg-white shadow cursor-pointer"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
    </aside>
  );
}
