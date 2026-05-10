// InstrutorAulas — placeholder.

import { Link } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";

export default function InstrutorAulas() {
  return (
    <PageScaffold
      eyebrow="EM CONSTRUÇÃO"
      title="Suas aulas (coach)"
      back
      showTabBar={false}
    >
      <div className="hv-card p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
          <HVIcon name="calendar" size={26} color="hsl(var(--hv-navy))" />
        </div>
        <div className="font-display text-[18px] text-hv-navy">
          Em construção · próxima iteração
        </div>
        <p className="text-sm text-hv-text-2 mt-2 max-w-[260px] mx-auto">
          Vai listar as aulas que você dá com link rápido pra chamada.
        </p>
      </div>

      <Link
        to="/equipe"
        className="hv-card w-full p-4 flex items-center gap-3 hover:bg-hv-foam/40"
      >
        <div className="w-10 h-10 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy">
          <HVIcon name="home" size={18} />
        </div>
        <div className="flex-1">
          <div className="font-display text-[14px]">Voltar pra Filial</div>
          <div className="text-[11px] text-hv-text-3 mt-0.5">Home da equipe</div>
        </div>
        <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
      </Link>
    </PageScaffold>
  );
}
