// AdminDashboard — placeholder para /admin/dashboard.
// Por enquanto reaproveita o KPI grid do FilialHome. Pode evoluir.

import { AdminHeader } from "@/components/AdminHeader";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader title="Dashboard" sub="ADMIN · MÉTRICAS DA FILIAL" back={false} />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="hv-card p-6 text-center">
          <div className="font-display text-[16px] font-bold text-hv-text-1">
            Em breve
          </div>
          <div className="text-[12px] text-hv-text-3 mt-2 leading-relaxed">
            Painel consolidado com KPIs, frequência e receita.
            <br />
            Por enquanto consulte <b>Relatórios</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
