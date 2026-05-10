// SuperFiliais — placeholder.

import { Link } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";

export default function SuperFiliais() {
  return (
    <PageScaffold
      eyebrow="REDE HIP VA'A"
      title="Filiais"
      showTabBar={false}
    >
      <div className="hv-card p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
          <HVIcon name="compass" size={26} color="hsl(var(--hv-navy))" />
        </div>
        <div className="font-display text-[18px] text-hv-navy">
          Em construção · próxima iteração
        </div>
        <p className="text-sm text-hv-text-2 mt-2 max-w-[280px] mx-auto">
          Painel do superadmin: KPIs por filial, ranking de receita, controle de tenants.
        </p>
      </div>

      <Link
        to="/equipe"
        className="hv-card w-full p-4 flex items-center gap-3 hover:bg-hv-foam/40"
      >
        <div className="w-10 h-10 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy">
          <HVIcon name="users" size={18} />
        </div>
        <div className="flex-1">
          <div className="font-display text-[14px]">Painel da equipe</div>
          <div className="text-[11px] text-hv-text-3 mt-0.5">Ver como operador</div>
        </div>
        <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
      </Link>
    </PageScaffold>
  );
}
