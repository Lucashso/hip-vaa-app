// Admin · Parceiros — cards parceiros com check-ins.
// Baseado em admin-mobile.jsx HVAdminParceiros.

import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminParceiros } from "@/hooks/useAdminParceiros";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#7B2D9F", "#1B6FB0", "#7A4A1F", "#2FB37A", "#FF6B4A", "#F2B544"];

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

export default function AdminParceiros() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: parceiros = [], isLoading } = useAdminParceiros(tenantId);

  const active = parceiros.filter((p) => p.active).length;
  const inactive = parceiros.length - active;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Parceiros"
        sub={`${active} ATIVO${active === 1 ? "" : "S"}${inactive ? ` · ${inactive} INATIVO${inactive === 1 ? "" : "S"}` : ""}`}
        action={<PlusBtn />}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : parceiros.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum parceiro cadastrado.
          </div>
        ) : (
          parceiros.map((p, i) => {
            const c = COLORS[i % COLORS.length];
            const initial = (p.name?.[0] || "?").toUpperCase();
            return (
              <div
                key={p.id}
                className="hv-card mb-2 flex gap-3 items-center"
                style={{ padding: 12 }}
              >
                <div
                  className="w-11 h-11 rounded-[12px] grid place-items-center text-white font-extrabold"
                  style={{ background: c, fontFamily: "var(--hv-font-display)" }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold truncate">{p.name}</span>
                    {p.description && (
                      <span
                        className="hv-chip truncate"
                        style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-2))" }}
                      >
                        {p.description.slice(0, 18)}
                      </span>
                    )}
                  </div>
                  <div
                    className="hv-mono text-[10px] text-hv-text-3 mt-1"
                    style={{ letterSpacing: "0.05em" }}
                  >
                    {p.students_count} alunos · {p.checkins_count} check-ins
                  </div>
                </div>
                <span
                  className="w-[10px] h-[10px] rounded-[5px] shrink-0"
                  style={{
                    background: p.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
