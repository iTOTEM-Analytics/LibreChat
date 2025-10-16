import { useLocation, useNavigate } from "react-router-dom";
import { useBreadcrumb } from "./BreadcrumbContext";

const labelMap: Record<string, string> = {
  main: "Main",
  dashboard: "Apps",
  ldai: "LDAI",
  admin: "Admin",
  chat: "Chat",
  upload: "Upload",
  geoscanner: "GeoScanner",
  storyfinder: "StoryFinder",
};

const knownRoutes = [
  "/dashboard",
  "/ldai",
  "/ldai/admin",
  "/ldai/chat",
  "/geoscanner",
  "/geoscanner/upload",
  "/storyfinder",
];

export default function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { override } = useBreadcrumb();

  const parts = location.pathname.split("/").filter(Boolean);
  const fullCrumbs = ["main", ...parts];
  const isStoryProjectRoute = parts[0] === "storyfinder" && parts.length >= 2;

  return (
    <div className="text-sm text-gray-500 border-b border-gray-200 mb-4 px-1">
      <nav className="flex flex-wrap items-center">
        {fullCrumbs.map((segment, index) => {
          const isLast = index === fullCrumbs.length - 1;

          // Base label
          let label =
            labelMap[segment.toLowerCase()] ||
            segment.charAt(0).toUpperCase() + segment.slice(1);

          // If we're on a story project page, format the last crumb as "Project: {name}"
          if (isLast && isStoryProjectRoute) {
            const name = override || label;
            label = name ? `Project: ${name}` : "Project";
          } else if (isLast && override) {
            // Otherwise, allow normal override behavior
            label = override;
          }

          // Build path for clickable crumbs
          const path =
            segment === "main"
              ? "/dashboard"
              : "/" + parts.slice(0, index).join("/");

          const isValid = segment === "main" || knownRoutes.includes(path);

          return (
            <span key={index} className="flex items-center mb-2">
              {index > 0 && <span className="mx-2 text-gray-300">›</span>}
              {isLast ? (
                <span className="text-gray-700 font-medium">{label}</span>
              ) : isValid ? (
                <span
                  className="text-gray-500 hover:text-black cursor-pointer"
                  onClick={() => navigate(path)}
                >
                  {label}
                </span>
              ) : (
                <span className="text-gray-500">{label}</span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
