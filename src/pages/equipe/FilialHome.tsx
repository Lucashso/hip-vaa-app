// FilialHome — placeholder home da equipe.

import { Link } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";

interface ShortcutItem {
  to: string;
  icon: HVIconName;
  label: string;
  caption: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { to: "/equipe/aulas", icon: "calendar", label: "Aulas", caption: "Grade e chamada" },
  { to: "/equipe/time", icon: "users", label: "Time", caption: "Equipe da filial" },
  { to: "/equipe/papel", icon: "settings", label: "Papel", caption: "Trocar perfil" },
];

export default function FilialHome() {
  const { profile } = useAuth();
  const { data: tenant } = useTenant();

  return (
    <PageScaffold
      eyebrow="EQUIPE"
      title={tenant?.name || "Filial"}
      showTabBar={false}
    >
      <div className="hv-card p-5">
        <div className="hv-eyebrow">OLÁ, {(profile?.full_name || "Equipe").split(" ")[0].toUpperCase()}</div>
        <div className="font-display text-[22px] mt-1">Painel em construção</div>
        <p className="text-sm text-hv-text-2 mt-2">
          Próxima iteração: KPIs do dia, presença, agenda da semana e financeiro da filial.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="hv-card p-4 flex flex-col items-center text-center hover:bg-hv-foam/40"
          >
            <div className="w-11 h-11 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy mb-2">
              <HVIcon name={s.icon} size={20} />
            </div>
            <div className="font-display text-[13px] leading-tight">{s.label}</div>
            <div className="text-[10px] text-hv-text-3 mt-0.5">{s.caption}</div>
          </Link>
        ))}
      </div>
    </PageScaffold>
  );
}
