// SuperShell — layout desktop compartilhado das telas de Super Admin (sidebar + content).
// Fiel ao SuperShell do super-extras2.jsx.

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";

export type SuperNavKey =
  | "Dashboard"
  | "Filiais"
  | "Financeiro"
  | "Contratos"
  | "Planos SaaS"
  | "Banners globais"
  | "Parceiros"
  | "Analytics"
  | "Push"
  | "Configurações";

interface NavItem {
  label: SuperNavKey;
  icon: HVIconName;
  path: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", icon: "home", path: "/rede" },
  { label: "Filiais", icon: "compass", path: "/rede" },
  { label: "Financeiro", icon: "wallet", path: "/rede/financeiro" },
  { label: "Contratos", icon: "credit", path: "/rede/contratos" },
  { label: "Planos SaaS", icon: "trend", path: "/rede/planos" },
  { label: "Banners globais", icon: "star", path: "/rede/banners" },
  { label: "Parceiros", icon: "users", path: "/rede/parceiros" },
  { label: "Analytics", icon: "trend", path: "/rede/analytics" },
  { label: "Push", icon: "bell", path: "/rede/push" },
  { label: "Configurações", icon: "settings", path: "/rede/config" },
];

interface Props {
  active: SuperNavKey;
  sub: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SuperShell({ active, sub, title, action, children }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "hsl(var(--hv-bg))",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: "hsl(var(--hv-ink))",
          color: "rgba(255,255,255,0.9)",
          padding: "20px 14px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 6px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <HVLogo size={28} color="white" />
          <div>
            <div
              className="hv-mono"
              style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1.4 }}
            >
              LEME HUB
            </div>
            <div
              style={{
                fontFamily: "var(--hv-font-display, 'Bricolage Grotesque')",
                fontSize: 14,
                fontWeight: 700,
                color: "white",
              }}
            >
              Super Admin
            </div>
          </div>
        </div>

        <nav style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((m) => {
            const on = m.label === active;
            return (
              <button
                key={m.label}
                onClick={() => navigate(m.path)}
                style={{
                  padding: "9px 10px",
                  borderRadius: 8,
                  background: on ? "hsl(var(--hv-cyan) / 0.18)" : "transparent",
                  color: on ? "hsl(var(--hv-cyan))" : "rgba(255,255,255,0.75)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                  fontWeight: on ? 600 : 500,
                  cursor: "pointer",
                  border: "none",
                  textAlign: "left",
                }}
              >
                <HVIcon name={m.icon} size={15} stroke={1.8} />
                {m.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 16,
          }}
        >
          <div>
            <div
              className="hv-mono"
              style={{
                fontSize: 11,
                color: "hsl(var(--hv-text-3))",
                letterSpacing: 1.4,
                fontWeight: 600,
              }}
            >
              {sub}
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 30, marginTop: 2, fontWeight: 700 }}
            >
              {title}
            </h1>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
