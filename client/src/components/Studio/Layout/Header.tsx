import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircleUser, ChevronDown } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left Section: Logo + Breadcrumb */}
      <div className="flex items-center">
        <Link to="/dashboard" className="flex items-center gap-1 text-xl font-bold">
          <img
            src="/itotem-studio-logo.svg"
            alt="iTOTEM Logo Icon"
            className="h-5 w-5 mr-2"
          />
          <span className="text-blue-900">iTOTEM</span>
          <span className="text-teal-600">Studio</span>
        </Link>

      </div>

      {/* Right: User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-800 hover:text-black hover:bg-gray-100 rounded-md border border-gray-200 transition cursor-pointer"
        >
          <CircleUser size={22} />
          <span className="hidden sm:inline">Hi, Demo User!</span>
          <ChevronDown size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 z-100 min-w-full bg-white border border-gray-200 shadow-lg rounded-md  text-sm">
            <ul className="py-1">
              {["Profile Settings", "Support"].map((item, idx) => (
                <li key={idx}>
                  <div className="group relative">
                    <button
                      className="w-full text-left px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 cursor-pointer"
                    >
                      {item}
                    </button>
                    <div className="absolute left-10 top-6 z-50 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded-sm shadow-sm">
                      This option is disabled in demo mode
                    </div>
                  </div>
                </li>
              ))}
              <li><hr className="border-gray-200 my-1" /></li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                >
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
