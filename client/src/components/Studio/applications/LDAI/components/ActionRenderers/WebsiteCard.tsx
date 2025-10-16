// frontend/src/applications/LDAI/components/ActionRenderers/WebsiteCard.tsx
import React from "react";
import { Earth, ExternalLink } from "lucide-react";

export interface WebsiteCardProps {
  website: string;
  title?: string;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ website, title }) => {
  // Debug: log the website URL being received
  console.log("[WebsiteCard] Received website URL:", website);
  
  // Ensure we have a valid URL for clicking
  let clickableUrl = website;
  if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
    clickableUrl = `https://${website}`;
  }

  // For display, remove www. prefix but keep the full domain
  const displayUrl = website.replace(/^https?:\/\/(www\.)?/i, '');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm w-full max-w-full">
      <div className="flex items-center gap-2 mb-2">
        <Earth size={16} className="text-teal-600" />
        <div className="font-medium text-gray-900">
          {title || "Website"}
        </div>
      </div>

      <a
        href={clickableUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-mono text-sm hover:underline"
      >
        <span className="truncate">{displayUrl}</span>
        <ExternalLink size={14} className="flex-shrink-0" />
      </a>
    </div>
  );
};

export default WebsiteCard;
