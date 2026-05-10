// AdminHeader — header gradient ocean reutilizado pelas telas admin mobile.
// Baseado no design admin-mobile.jsx HVAdminHeader.

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";

interface AdminHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
  back?: boolean;
}

export function AdminHeader({ title, sub, action, back = true }: AdminHeaderProps) {
  const navigate = useNavigate();
  return (
    <div
      className="px-4 pt-4 pb-3.5 text-white"
      style={{ background: "linear-gradient(135deg, #061826, #0E3A5F)" }}
    >
      <div className="flex items-center gap-2.5">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-[10px] grid place-items-center border-0 text-white"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <HVIcon name="chevron-left" size={18} />
          </button>
        )}
        {sub && (
          <div
            className="hv-mono flex-1 text-[10px] opacity-70"
            style={{ letterSpacing: "0.14em" }}
          >
            {sub}
          </div>
        )}
        {!sub && <div className="flex-1" />}
        {action}
      </div>
      <h1
        className="text-white mt-2.5"
        style={{ fontFamily: "var(--hv-font-display, 'Bricolage Grotesque')", fontSize: 24 }}
      >
        {title}
      </h1>
    </div>
  );
}
