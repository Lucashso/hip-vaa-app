// Admin · Relatórios — KPIs + bar chart + aniversariantes.
// Baseado em admin-mobile.jsx HVAdminRelatorios.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useImportantDates } from "@/hooks/useImportantDates";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = ["Visão geral", "Frequência", "Alunos", "Operacional", "Parceiros"];
const BIRTHDAY_COLORS = ["#2FB37A", "#FF6B4A", "#1B6FB0", "#7B2D9F", "#F2B544"];

const KPIS = [
  { l: "RECEITA 30D", v: "R$ 41.2k", d: "+8.4%", c: "hsl(var(--hv-leaf))" },
  { l: "NOVOS ALUNOS", v: "12", d: "+50%", c: "hsl(var(--hv-leaf))" },
  { l: "CHURN", v: "2.1%", d: "−0.3pp", c: "hsl(var(--hv-leaf))" },
  { l: "FREQUÊNCIA", v: "92%", d: "−1pp", c: "hsl(var(--hv-amber))" },
];

const BAR_DATA = [
  { m: "DEZ", h: 42 },
  { m: "JAN", h: 56 },
  { m: "FEV", h: 48 },
  { m: "MAR", h: 62 },
  { m: "ABR", h: 71 },
  { m: "MAI", h: 78 },
];

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function AdminRelatorios() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const { data: dates = [], isLoading } = useImportantDates(tenantId, 30);

  const birthdays = dates.filter((d) => d.type === "birthday" || (d.title || "").toLowerCase().includes("anivers"));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Relatórios" sub="ÚLTIMOS 30 DIAS" />
      <div
        className="flex gap-3.5 px-4 pt-2.5 pb-1.5 bg-hv-surface border-b border-hv-line overflow-x-auto"
      >
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              "py-1.5 text-[12px] bg-transparent border-0 whitespace-nowrap",
              tab === i ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom: tab === i ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <Chips
        items={[
          { l: "7d", on: range === "7d", onClick: () => setRange("7d") },
          { l: "30d", on: range === "30d", onClick: () => setRange("30d") },
          { l: "90d", on: range === "90d", onClick: () => setRange("90d") },
          { l: "Customizado", on: range === "custom", onClick: () => setRange("custom") },
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {KPIS.map((k) => (
            <div key={k.l} className="hv-card p-3">
              <div
                className="hv-mono text-[9px] font-bold text-hv-text-3"
                style={{ letterSpacing: "0.1em" }}
              >
                {k.l}
              </div>
              <div className="font-display text-[20px] font-extrabold mt-1">{k.v}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: k.c }}>
                {k.d}
              </div>
            </div>
          ))}
        </div>

        <div className="hv-card mt-3" style={{ padding: 14 }}>
          <div
            className="hv-mono text-[10px] font-bold text-hv-text-3"
            style={{ letterSpacing: "0.12em" }}
          >
            RECEITA MENSAL · 6 MESES
          </div>
          <svg viewBox="0 0 320 120" className="w-full mt-2">
            {BAR_DATA.map((b, i) => (
              <g key={b.m}>
                <rect
                  x={20 + i * 50}
                  y={110 - b.h}
                  width="30"
                  height={b.h}
                  fill="hsl(var(--hv-cyan))"
                  rx="3"
                />
                <text
                  x={35 + i * 50}
                  y="118"
                  textAnchor="middle"
                  fontSize="8"
                  fill="hsl(var(--hv-text-3))"
                  fontFamily="JetBrains Mono"
                >
                  {b.m}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-3.5 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Aniversariantes próximos
        </h3>

        {isLoading ? (
          <Loader />
        ) : birthdays.length === 0 ? (
          <div className="hv-card p-4 text-center text-sm text-hv-text-2">
            Nenhum aniversariante no período.
          </div>
        ) : (
          <div className="hv-card overflow-hidden p-0">
            {birthdays.map((b, i, a) => {
              const c = BIRTHDAY_COLORS[i % BIRTHDAY_COLORS.length];
              const initial = (b.title?.[0] || "?").toUpperCase();
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2.5"
                  style={{
                    padding: "10px 14px",
                    borderBottom: i < a.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-[30px] h-[30px] rounded-[15px] grid place-items-center text-white font-bold"
                    style={{ background: c }}
                  >
                    {initial}
                  </div>
                  <span className="flex-1 text-[13px] font-semibold truncate">{b.title}</span>
                  <span className="hv-mono text-[11px] text-hv-text-3">{formatDay(b.date)}</span>
                  <HVIcon name="gift" size={16} color="hsl(var(--hv-coral))" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
