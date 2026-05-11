// AdminBottomNav — bottom nav mobile (md:hidden) das rotas /admin/*.
// 5 itens: Hoje / Alunos / Coach (ou Aulas) / Comunidade / Mais.
// Badges funcionais: Comunidade usa useNewCommunityPosts, Mais usa useAdminNotifications.

import { NavLink } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useNewCommunityPosts } from "@/hooks/useCommunity";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

interface NavItem {
  to: string;
  icon: HVIconName;
  label: string;
  end?: boolean;
  badge?: number;
}

export function AdminBottomNav() {
  const perm = usePermissions();
  const { profile } = useAuth();
  const { data: tenant } = useTenant();
  const tenantId = tenant?.id ?? profile?.tenant_id ?? null;

  const { count: newPosts } = useNewCommunityPosts(tenantId ?? undefined);
  const { byType } = useAdminNotifications(tenantId);
  const overdueBadge = byType.overdue_invoices;

  // "Mais" badge: soma de outras notificações (pedidos pendentes, drop-ins, etc.)
  const maisBadge = byType.pending_orders + byType.pending_dropins + byType.pending_tours + overdueBadge;

  // Se admin pode acessar Coach, usa Coach. Senão cai pra Aulas (chamada/lista).
  const coachItem: NavItem = perm.canAccessCoach
    ? { to: "/admin/coach", icon: "dumbbell", label: "Coach" }
    : { to: "/admin/aulas", icon: "calendar", label: "Aulas" };

  const items: NavItem[] = [
    { to: "/admin", icon: "home", label: "Hoje", end: true },
    { to: "/admin/alunos", icon: "users", label: "Alunos" },
    coachItem,
    { to: "/admin/comunidade", icon: "users", label: "Comunidade", badge: newPosts },
    { to: "/admin/mais", icon: "menu", label: "Mais", badge: maisBadge },
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
                <div className="relative">
                  <HVIcon name={tab.icon} size={22} stroke={isActive ? 2.2 : 1.8} />
                  {tab.badge != null && tab.badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full text-white text-[9px] font-extrabold flex items-center justify-center px-0.5"
                      style={{ background: "hsl(var(--hv-coral))", lineHeight: 1 }}
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>
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
