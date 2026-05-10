// Admin · Locais — venues do tenant com hero gradient + mapa SVG.
// Baseado em admin-mobile.jsx HVAdminLocais.

import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminLocais } from "@/hooks/useAdminLocais";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#1B6FB0", "#25C7E5", "#2FB37A", "#FF6B4A", "#7B2D9F", "#F2B544"];

function PlusBtn({ label = "Novo" }: { label?: string }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
      style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
    >
      <HVIcon name="plus" size={14} stroke={2.6} />
      {label}
    </button>
  );
}

export default function AdminLocais() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: locais = [], isLoading } = useAdminLocais(tenantId);
  const active = locais.filter((l) => l.active).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Locais"
        sub={`${active} ATIVO${active === 1 ? "" : "S"} NA FILIAL`}
        action={<PlusBtn />}
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : locais.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum local cadastrado.
          </div>
        ) : (
          locais.map((l, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div key={l.id} className="hv-card mb-2.5 overflow-hidden p-0">
                <div
                  className="h-[90px] relative"
                  style={{ background: `linear-gradient(135deg, ${c}, #061826)` }}
                >
                  <svg
                    viewBox="0 0 360 90"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 60 Q90 50 180 60 T360 60 L360 90 L0 90Z"
                      fill="rgba(37,199,229,0.4)"
                    />
                    <path
                      d="M0 75 Q90 65 180 75 T360 75 L360 90 L0 90Z"
                      fill="rgba(37,199,229,0.7)"
                    />
                    <circle cx="240" cy="38" r="10" fill="white" />
                    <path
                      d="M240 38 L240 24 M240 38 L252 38"
                      stroke="#FF6B4A"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="p-3.5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold truncate">{l.name}</div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5">
                        {l.address || "Endereço não informado"}
                      </div>
                    </div>
                    <span
                      className="hv-chip"
                      style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                    >
                      cap. {l.default_capacity ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
