// AppHeader — top bar desktop (md+) usada dentro do AdminLayout.
// Logo/tenant à esquerda + search placeholder + sininho + avatar dropdown.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { HVIcon } from "@/lib/HVIcon";
import { getInitial } from "@/lib/utils";
import { AdminNotificationBell } from "@/components/Notifications";

export function AppHeader() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: tenant } = useTenant();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut();
    navigate("/auth");
  }

  const tenantName = tenant?.name || "Hip Va'a";
  const initial = getInitial(profile?.full_name);

  return (
    <header className="hidden md:flex sticky top-0 z-30 bg-hv-surface border-b border-hv-line items-center gap-3 px-5 py-2.5">
      <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-[10px] grid place-items-center font-display font-extrabold bg-hv-navy text-white text-sm shrink-0">
          {(tenantName[0] || "H").toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="hv-eyebrow">Filial</div>
          <div className="font-display text-[14px] font-bold truncate text-hv-text-1">
            {tenantName}
          </div>
        </div>
      </Link>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-hv-text-3 pointer-events-none">
            <HVIcon name="search" size={16} />
          </div>
          <input
            type="search"
            placeholder="Buscar aluno, fatura, pedido..."
            disabled
            className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-hv-bg border border-hv-line text-[13px] text-hv-text-2 placeholder:text-hv-text-3 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AdminNotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-[12px] grid place-items-center font-display font-extrabold bg-hv-navy text-white text-sm border border-hv-line hover:opacity-90"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Conta"
          >
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
                className="w-10 h-10 rounded-[12px] object-cover"
              />
            ) : (
              initial
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 min-w-[200px] bg-hv-surface border border-hv-line rounded-[12px] shadow-lg py-1.5 z-40"
            >
              <div className="px-3 py-2 border-b border-hv-line">
                <div className="font-display text-[13px] font-bold truncate text-hv-text-1">
                  {profile?.full_name || "Usuário"}
                </div>
                {profile?.email && (
                  <div className="text-[11px] text-hv-text-3 truncate">
                    {profile.email}
                  </div>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin/perfil");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-hv-text-2 hover:bg-hv-foam/40 hover:text-hv-text-1"
              >
                <HVIcon name="user" size={16} />
                <span>Perfil</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin/configuracoes");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-hv-text-2 hover:bg-hv-foam/40 hover:text-hv-text-1"
              >
                <HVIcon name="settings" size={16} />
                <span>Configurações</span>
              </button>
              <div className="border-t border-hv-line my-1" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-hv-coral hover:bg-hv-foam/40"
              >
                <HVIcon name="logout" size={16} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
