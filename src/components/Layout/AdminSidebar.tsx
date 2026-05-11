// AdminSidebar — sidebar desktop (md+) das rotas /admin/*.
// Filtra items por permissão via usePermissions().
// Espelhado do lemehubapp-main com a paleta oceanic do hipvaa.

import { NavLink, useNavigate } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { usePermissions } from "@/hooks/usePermissions";

interface NavItem {
  to: string;
  icon: HVIconName;
  label: string;
  end?: boolean;
  show: boolean;
}

export function AdminSidebar() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { data: tenant } = useTenant();
  const perm = usePermissions();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Lista completa de items, com flag `show` baseada em permissões.
  const items: NavItem[] = [
    { to: "/admin", icon: "home", label: "Hoje", end: true, show: true },
    { to: "/admin/dashboard", icon: "trend", label: "Dashboard", show: perm.canAccessDashboard },
    { to: "/admin/alunos", icon: "users", label: "Alunos", show: perm.canAccessStudents },
    { to: "/admin/aulas", icon: "calendar", label: "Aulas", show: perm.canAccessClasses },
    { to: "/admin/coach", icon: "dumbbell", label: "Coach", show: perm.canAccessCoach },
    { to: "/admin/tripulacoes", icon: "boat", label: "Tripulação", show: perm.canAccessCrewSummary },
    { to: "/admin/equipes", icon: "users", label: "Equipes", show: perm.canAccessTeams },
    { to: "/admin/treinos", icon: "dumbbell", label: "Treinos", show: perm.canAccessWorkouts },
    { to: "/admin/biblioteca-treinos", icon: "dumbbell", label: "Biblioteca", show: perm.canAccessTrainingPlans },
    { to: "/admin/financeiro", icon: "wallet", label: "Financeiro", show: perm.canAccessFinancial },
    { to: "/admin/faturas", icon: "wallet", label: "Faturas", show: perm.canAccessFinancial },
    { to: "/admin/relatorios", icon: "trend", label: "Relatórios", show: perm.canAccessReports },
    { to: "/admin/banners", icon: "star", label: "Banners", show: perm.canAccessCommunication },
    { to: "/admin/avisos", icon: "bell", label: "Avisos", show: perm.canAccessAnnouncements },
    { to: "/admin/comunidade", icon: "users", label: "Comunidade", show: perm.canModerateCommunity },
    { to: "/admin/parceiros", icon: "share", label: "Parceiros", show: true },
    { to: "/admin/locais", icon: "compass", label: "Locais", show: perm.canAccessVenues },
    { to: "/admin/canoas", icon: "boat", label: "Canoas", show: perm.canAccessBoats },
    { to: "/admin/planos", icon: "wallet", label: "Planos", show: perm.canAccessPlans },
    { to: "/admin/produtos", icon: "shop", label: "Produtos", show: true },
    { to: "/admin/pedidos-loja", icon: "shop", label: "Pedidos", show: true },
    { to: "/admin/usuarios", icon: "user", label: "Usuários", show: perm.canAccessUsers },
    { to: "/admin/questionario-saude", icon: "check", label: "Questionário", show: perm.canAccessHealthQuestionnaire },
    { to: "/admin/termos", icon: "credit", label: "Termos", show: perm.canAccessTerms },
    { to: "/admin/configuracoes", icon: "settings", label: "Configurações", show: perm.canAccessSettings },
    { to: "/admin/perfil", icon: "user", label: "Perfil", show: true },
    { to: "/admin/ajuda", icon: "share", label: "Ajuda", show: true },
  ];

  const visibleItems = items.filter((i) => i.show);

  const tenantName = tenant?.name || "Hip Va'a";
  const initial = (profile?.full_name?.[0] || "A").toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-hv-surface border-r border-hv-line h-screen sticky top-0 overflow-y-auto">
      {/* Header tenant */}
      <div className="px-4 py-4 border-b border-hv-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] grid place-items-center font-display font-extrabold bg-hv-navy text-white text-sm">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[9px] text-hv-text-3 tracking-[0.16em] font-semibold uppercase">
              Admin
            </div>
            <div className="font-display text-[13px] font-bold truncate text-hv-text-1">
              {tenantName}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-colors",
                isActive
                  ? "bg-hv-foam text-hv-navy"
                  : "text-hv-text-3 hover:bg-hv-foam/40 hover:text-hv-text-1",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r",
                    isActive ? "bg-hv-cyan" : "bg-transparent",
                  )}
                />
                <HVIcon name={item.icon} size={18} stroke={isActive ? 2.2 : 1.8} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2.5 py-3 border-t border-hv-line">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-hv-text-3 hover:bg-hv-foam/40 hover:text-hv-coral"
        >
          <HVIcon name="logout" size={18} stroke={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
