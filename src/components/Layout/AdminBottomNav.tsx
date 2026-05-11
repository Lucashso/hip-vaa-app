// AdminBottomNav — bottom nav mobile (md:hidden) das rotas /admin/*.
// 5 itens: Hoje / Alunos / Coach (ou Aulas) / Comunidade / Mais.
// Espelhado do lemehubapp-main BottomNav (type=admin), paleta oceanic hipvaa.

import { NavLink } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface NavItem {
  to: string;
  icon: HVIconName;
  label: string;
  end?: boolean;
}

export function AdminBottomNav() {
  const perm = usePermissions();

  // Se admin pode acessar Coach, usa Coach. Senão cai pra Aulas (chamada/lista).
  const coachItem: NavItem = perm.canAccessCoach
    ? { to: "/admin/coach", icon: "dumbbell", label: "Coach" }
    : { to: "/admin/aulas", icon: "calendar", label: "Aulas" };

  const items: NavItem[] = [
    { to: "/admin", icon: "home", label: "Hoje", end: true },
    { to: "/admin/alunos", icon: "users", label: "Alunos" },
    coachItem,
    { to: "/admin/comunidade", icon: "users", label: "Comunidade" },
    { to: "/admin/mais", icon: "menu", label: "Mais" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-hv-surface border-t border-hv-line pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5 max-w-md mx-auto h-16">
        {items.map((tab) => (
          <NavLink
            key={tab.to + tab.label}
            to={tab.to}
            end={tab.end}
            className="relative"
          >
            {({ isActive }) => (
              <div
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                  isActive ? "text-hv-navy" : "text-hv-text-3",
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
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default AdminBottomNav;
