// frontend/src/applications/LDAI/components/ActionRenderers/ContactCard.tsx
import React from "react";
import {
  User,
  Briefcase,
  Mail,
  Phone,
  Link as LinkIcon,
  Linkedin,
} from "lucide-react";

type RowProps = {
  icon: React.ReactNode;
  text?: string;
  href?: string;
};

const Row: React.FC<RowProps> = ({ icon, text, href }) => {
  if (!text) return null;
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="truncate underline underline-offset-2 hover:text-slate-900"
    >
      {text}
    </a>
  ) : (
    <div className="truncate">{text}</div>
  );
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-slate-500">{icon}</span>
      {content}
    </div>
  );
};

export interface ContactCardProps {
  fullName: string;
  title?: string;
  org?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  note?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  fullName,
  title,
  org,
  email,
  phone,
  website,
  linkedin,
  note,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm w-full max-w-full">
      <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-slate-500" />
        <div className="font-semibold text-slate-900 truncate">
          {fullName || "Contact"}
        </div>
      </div>

      {(title || org) && (
        <div className="ml-6 mb-4">
          <Row
            icon={<Briefcase size={14} />}
            text={[title, org].filter(Boolean).join(" • ")}
          />
        </div>
      )}

      <div className="ml-6 space-y-3">
        <Row icon={<Mail size={14} />} text={email} href={email ? `mailto:${email}` : undefined} />
        <Row icon={<Phone size={14} />} text={phone} href={phone ? `tel:${phone}` : undefined} />
        <Row icon={<LinkIcon size={14} />} text={website} href={website} />
        <Row icon={<Linkedin size={14} />} text={linkedin} href={linkedin} />
        {note && <div className="text-slate-600 mt-3">{note}</div>}
      </div>
    </div>
  );
};

export default ContactCard;
