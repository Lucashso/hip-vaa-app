// AdminTreinos — placeholder para /admin/treinos.

import { AdminHeader } from "@/components/AdminHeader";

export default function AdminTreinos() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader title="Treinos" sub="ADMIN · PLANOS DE TREINO" back={false} />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="hv-card p-6 text-center">
          <div className="font-display text-[16px] font-bold text-hv-text-1">
            Em breve
          </div>
          <div className="text-[12px] text-hv-text-3 mt-2 leading-relaxed">
            Criação e atribuição de treinos.
            <br />
            Por enquanto use <b>Biblioteca de treinos</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
