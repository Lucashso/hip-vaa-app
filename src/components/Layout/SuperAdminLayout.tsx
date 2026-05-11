// SuperAdminLayout — layout guarda-chuva das rotas /rede/*.
// Sidebar 220px persistente (baseado no SuperShell) + Outlet.
// Mobile: SuperAdminBottomNav com 5 itens.

import { Suspense } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  icon: HVIconName;
  path: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { label: "Filiais", icon: "compass", path: "/rede", end: true },
  { label: "Financeiro", icon: "wallet", path: "/rede/financeiro" },
  { label: "Contratos", icon: "credit", path: "/rede/contratos" },
  { label: "Planos SaaS", icon: "trend", path: "/rede/planos" },
  { label: "Analytics", icon: "trend", path: "/rede/analytics" },
  { label: "Banners globais", icon: "star", path: "/rede/banners" },
  { label: "Parceiros", icon: "share", path: "/rede/parceiros" },
  { label: "Push", icon: "bell", path: "/rede/push" },
  { label: "Configurações", icon: "settings", path: "/rede/config" },
];

// Bottom nav items (mobile) — 5 itens
const BOTTOM_NAV: NavItem[] = [
  { label: "Filiais", icon: "compass", path: "/rede", end: true },
  { label: "Financeiro", icon: "wallet", path: "/rede/financeiro" },
  { label: "Contratos", icon: "credit", path: "/rede/contratos" },
  { label: "Planos", icon: "trend", path: "/rede/planos" },
  { label: "Mais", icon: "menu", path: "/rede/config" },
];

function SuperAdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside
      className="hidden md:flex flex-col shrink-0"
      style={{
        width: 220,
        background: "hsl(var(--hv-ink))",
        color: "rgba(255,255,255,0.9)",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "18px 14px 16px",
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

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={{
                padding: "9px 10px",
                borderRadius: 8,
                background: isActive ? "hsl(var(--hv-cyan) / 0.18)" : "transparent",
                color: isActive ? "hsl(var(--hv-cyan))" : "rgba(255,255,255,0.75)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
              }}
            >
              <HVIcon name={item.icon} size={15} stroke={isActive ? 2.2 : 1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "9px 10px",
            borderRadius: 8,
            background: "transparent",
            color: "rgba(255,255,255,0.55)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
          className="hover:text-white"
        >
          <HVIcon name="logout" size={15} stroke={1.8} />
          Sair
        </button>
      </div>
    </aside>
  );
}

function SuperAdminBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
      style={{ background: "hsl(var(--hv-ink))", borderTop: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="grid grid-cols-5 max-w-md mx-auto h-16">
        {BOTTOM_NAV.map((tab) => {
          const isActive = tab.end
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path + tab.label}
              to={tab.path}
              end={tab.end}
              className="relative"
            >
              <div
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                  isActive ? "text-hv-cyan" : "text-white/50",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b transition-all",
                    isActive ? "bg-hv-cyan" : "bg-transparent",
                  )}
                />
                <HVIcon name={tab.icon} size={22} stroke={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function SuperAdminLayout() {
  return (
    <div className="min-h-screen flex w-full" style={{ background: "hsl(var(--hv-bg))" }}>
      <SuperAdminSidebar />
      <main className="flex-1 min-h-screen min-w-0 overflow-x-hidden pb-20 md:pb-0 flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <SuperAdminBottomNav />
    </div>
  );
}

export default SuperAdminLayout;
