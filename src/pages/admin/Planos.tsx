// Admin · Planos — lista de planos do tenant.
// Baseado em admin-mobile.jsx HVAdminPlanos.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminPlanos } from "@/hooks/useAdminPlanos";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

type Filter = "all" | "active" | "inactive";

const COLORS = [
  "hsl(var(--hv-navy))",
  "hsl(var(--hv-blue))",
  "hsl(var(--hv-leaf))",
  "hsl(var(--hv-cyan))",
  "hsl(var(--hv-coral))",
  "hsl(var(--hv-amber))",
];

function planPeriod(p: { billing_cycle_days: number | null; type: string | null }): string {
  if (p.type === "drop_in") return "avulso";
  const d = p.billing_cycle_days ?? 30;
  if (d <= 31) return "mensal";
  if (d >= 350 && d <= 380) return "anual";
  return `${Math.round(d / 30)} meses`;
}

function PlusBtn({ label = "Novo", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
      style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
    >
      <HVIcon name="plus" size={14} stroke={2.6} />
      {label}
    </button>
  );
}

export default function AdminPlanos() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: planos = [], isLoading } = useAdminPlanos(tenantId);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const total = planos.length;
    const active = planos.filter((p) => p.active).length;
    return { total, active, inactive: total - active };
  }, [planos]);

  const filtered = useMemo(() => {
    if (filter === "active") return planos.filter((p) => p.active);
    if (filter === "inactive") return planos.filter((p) => !p.active);
    return planos;
  }, [planos, filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Planos de mensalidade"
        sub={`${counts.active} ATIVOS · ${counts.inactive} INATIVO${counts.inactive === 1 ? "" : "S"}`}
        action={<PlusBtn />}
      />
      <Chips
        items={[
          { l: `Todos · ${counts.total}`, on: filter === "all", onClick: () => setFilter("all") },
          { l: `Ativos · ${counts.active}`, on: filter === "active", onClick: () => setFilter("active") },
          { l: `Inativos · ${counts.inactive}`, on: filter === "inactive", onClick: () => setFilter("inactive") },
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
            Nenhum plano por enquanto.
          </div>
        ) : (
          filtered.map((p, i) => {
            const color = COLORS[i % COLORS.length];
            const paymentIcons: ("qr" | "credit" | "wallet")[] = (() => {
              const arr: ("qr" | "credit" | "wallet")[] = [];
              const cfg = p.payment_config as Record<string, unknown> | null;
              if (!cfg) return ["qr", "credit"];
              if (cfg.pix) arr.push("qr");
              if (cfg.credit_card || cfg.boleto) arr.push("credit");
              if (cfg.wallet || cfg.cash) arr.push("wallet");
              return arr.length > 0 ? arr : ["qr"];
            })();
            return (
              <div
                key={p.id}
                className="hv-card mb-2.5"
                style={{ padding: 14, opacity: p.active ? 1 : 0.55 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-[12px] grid place-items-center text-white"
                    style={{ background: color }}
                  >
                    <HVIcon name="wallet" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[14px] font-bold truncate">{p.name}</span>
                      <span
                        className="hv-chip"
                        style={
                          p.active
                            ? { background: "rgba(47,179,122,0.18)", color: "hsl(var(--hv-leaf))" }
                            : { background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }
                        }
                      >
                        {p.active ? "ativo" : "inativo"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-display text-[22px] font-extrabold">
                        {formatBRL(p.price_cents)}
                      </span>
                      <span className="text-[12px] text-hv-text-3">· {planPeriod(p)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {paymentIcons.map((x, j) => (
                        <span
                          key={`${x}-${j}`}
                          className="w-[26px] h-[26px] rounded-[7px] grid place-items-center"
                          style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-2))" }}
                        >
                          <HVIcon name={x} size={14} />
                        </span>
                      ))}
                      <span className="hv-mono ml-auto text-[10px] text-hv-text-3">
                        {p.classes_per_week ? `${p.classes_per_week}x/sem` : "ilimitado"}
                      </span>
                    </div>
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
