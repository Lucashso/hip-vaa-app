// Admin · Canoas — frota OC6/OC1 + visualização SVG dos assentos.
// Baseado em admin-mobile.jsx HVAdminCanoas.

import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminCanoas } from "@/hooks/useAdminCanoas";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#1B6FB0", "#2FB37A", "#F2B544", "#FF6B4A", "#7B2D9F", "#25C7E5"];

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

export default function AdminCanoas() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: canoas = [], isLoading } = useAdminCanoas(tenantId);

  const total = canoas.length;
  const inMaint = canoas.filter((c) => c.status === "maintenance").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Embarcações"
        sub={`${total} NA FROTA · ${inMaint} MANUTENÇÃO`}
        action={<PlusBtn />}
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : canoas.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhuma embarcação cadastrada.
          </div>
        ) : (
          canoas.map((c, i) => {
            const color = COLORS[i % COLORS.length];
            const isActive = c.status === "active";
            const cap = c.capacity || 1;
            return (
              <div key={c.id} className="hv-card mb-2.5" style={{ padding: 14 }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold truncate">{c.name}</div>
                    <div
                      className="hv-mono text-[11px] text-hv-text-3 mt-0.5"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {c.type} · {cap} {cap === 1 ? "lugar" : "lugares"}
                      {c.venue?.name ? ` · ${c.venue.name}` : ""}
                    </div>
                  </div>
                  <span
                    className="hv-chip"
                    style={
                      isActive
                        ? { background: "rgba(47,179,122,0.18)", color: "hsl(var(--hv-leaf))" }
                        : { background: "rgba(242,181,68,0.2)", color: "hsl(var(--hv-amber))" }
                    }
                  >
                    {isActive ? "ativa" : "manutenção"}
                  </span>
                </div>
                <svg viewBox="0 0 320 60" className="w-full">
                  <path
                    d="M20 30 Q40 8 160 8 Q280 8 300 30 Q280 52 160 52 Q40 52 20 30Z"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  {Array.from({ length: cap }).map((_, j) => (
                    <circle
                      key={`c-${j}`}
                      cx={50 + j * (220 / Math.max(cap, 1))}
                      cy="30"
                      r="8"
                      fill={color}
                      opacity="0.85"
                    />
                  ))}
                  {Array.from({ length: cap }).map((_, j) => (
                    <text
                      key={`t-${j}`}
                      x={50 + j * (220 / Math.max(cap, 1))}
                      y="34"
                      textAnchor="middle"
                      fontSize="9"
                      fill="white"
                      fontWeight="700"
                    >
                      {j + 1}
                    </text>
                  ))}
                </svg>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
