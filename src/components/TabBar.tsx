// TabBar oceânica — bottom nav do aluno.

import { NavLink } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

interface TabItem {
  to: string;
  icon: HVIconName;
  label: string;
}

const STUDENT_TABS: TabItem[] = [
  { to: "/", icon: "home", label: "Início" },
  { to: "/checkin", icon: "qr", label: "Check-in" },
  { to: "/aulas", icon: "calendar", label: "Aulas" },
  { to: "/plano", icon: "wallet", label: "Plano" },
  { to: "/perfil", icon: "user", label: "Perfil" },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-hv-surface border-t border-hv-line pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 max-w-md mx-auto h-16">
        {STUDENT_TABS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className="relative">
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
                <HVIcon name={item.icon} size={22} stroke={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
