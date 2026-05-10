// FilialFinanceiro — KPIs + pizza de status + inadimplentes (admin filial).
// Adaptado do HVFilialFinanceiro (equipe-extras.jsx).

import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useFinanceiroFilial } from "@/hooks/useAlunos";
import { cn, formatBRL, getInitial } from "@/lib/utils";

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

const COLORS_INAD = ["#FF6B4A", "#F2B544", "#7B2D9F", "#1B6FB0", "#25C7E5", "#2FB37A"];

export default function FilialFinanceiro() {
  const { profile } = useAuth();
  const { data: tenant } = useTenant();
  const { data, isLoading } = useFinanceiroFilial(profile?.tenant_id);

  const now = new Date();
  const mesAtual = MESES[now.getMonth()];
  const anoAtual = now.getFullYear();
  const tenantName = (tenant?.name || "Filial").toUpperCase();

  const receita = data?.receita_confirmada_cents ?? 0;
  const aReceber = data?.a_receber_cents ?? 0;
  const aReceberCount = data?.a_receber_count ?? 0;
  const inadCents = data?.inadimplencia_cents ?? 0;
  const inadCount = data?.inadimplencia_count ?? 0;
  const pagasPct = data?.pagas_pct ?? 0;
  const abertasPct = data?.abertas_pct ?? 0;
  const vencidasPct = data?.vencidas_pct ?? 0;
  const inadimplentes = data?.inadimplentes ?? [];

  // Gera path SVG das fatias de pizza
  const slices = (() => {
    const total = pagasPct + abertasPct + vencidasPct;
    if (total === 0) return null;
    let acc = 0;
    const items: Array<{ pct: number; color: string }> = [
      { pct: pagasPct, color: "hsl(var(--hv-leaf))" },
      { pct: abertasPct, color: "hsl(var(--hv-amber))" },
      { pct: vencidasPct, color: "hsl(var(--hv-coral))" },
    ];
    return items.map((it) => {
      const startAngle = (acc / 100) * 2 * Math.PI;
      const endAngle = ((acc + it.pct) / 100) * 2 * Math.PI;
      acc += it.pct;
      const x1 = Math.cos(startAngle);
      const y1 = Math.sin(startAngle);
      const x2 = Math.cos(endAngle);
      const y2 = Math.sin(endAngle);
      const largeArc = it.pct > 50 ? 1 : 0;
      if (it.pct >= 100) {
        return { d: "M -1 0 A 1 1 0 0 1 1 0 A 1 1 0 0 1 -1 0Z", color: it.color };
      }
      if (it.pct === 0) return null;
      return {
        d: `M ${x1.toFixed(4)} ${y1.toFixed(4)} A 1 1 0 ${largeArc} 1 ${x2.toFixed(4)} ${y2.toFixed(4)} L 0 0Z`,
        color: it.color,
      };
    });
  })();

  return (
    <PageScaffold
      eyebrow={`${tenantName} · ${mesAtual} ${anoAtual}`}
      title="Financeiro · filial"
      back
      showTabBar={false}
      trailing={
        <button
          type="button"
          className="w-9 h-9 rounded-[12px] grid place-items-center bg-hv-surface border border-hv-line text-hv-text"
        >
          <HVIcon name="filter" size={18} />
        </button>
      }
    >
      {/* Card de receita destaque */}
      <div
        className="hv-card relative overflow-hidden text-white"
        style={{
          padding: 16,
          background: "linear-gradient(140deg, #061826, #1B6FB0)",
        }}
      >
        <div className="hv-mono text-[10px] tracking-[0.14em] opacity-70">
          RECEITA {mesAtual} · CONFIRMADA
        </div>
        <div className="font-display font-extrabold mt-0.5 text-white" style={{ fontSize: 38 }}>
          {isLoading ? "—" : formatBRL(receita)}
        </div>
        <div className="flex gap-1.5 text-xs mt-1 opacity-85">
          <HVIcon name="trend" size={16} color="hsl(var(--hv-cyan))" /> +8.4% vs mês anterior
        </div>
        <svg viewBox="0 0 280 50" className="w-full mt-2">
          <path
            d="M0 35 L20 32 L40 28 L60 30 L80 22 L100 25 L120 18 L140 22 L160 14 L180 18 L200 10 L220 14 L240 8 L260 12 L280 6"
            stroke="rgba(37,199,229,0.9)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* KPI grid 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "A RECEBER", v: formatBRL(aReceber), d: `${aReceberCount} faturas`, c: "hsl(var(--hv-blue))" },
          { l: "INADIMPLÊNCIA", v: formatBRL(inadCents), d: `${inadCount} alunos`, c: "hsl(var(--hv-coral))" },
          { l: "DESPESAS", v: "R$ 12.6k", d: "salários + ops", c: "hsl(var(--hv-amber))" },
          { l: "LUCRO", v: "R$ 28.6k", d: "margem 69%", c: "hsl(var(--hv-leaf))" },
        ].map((k) => (
          <div key={k.l} className="hv-card" style={{ padding: 12 }}>
            <div className="hv-mono text-[9px] tracking-wider font-bold text-hv-text-3">
              {k.l}
            </div>
            <div
              className="font-display font-extrabold mt-1"
              style={{ fontSize: 18, color: k.c }}
            >
              {k.v}
            </div>
            <div className="text-[10px] text-hv-text-3 mt-px">{k.d}</div>
          </div>
        ))}
      </div>

      {/* pizza por status */}
      <div className="hv-card" style={{ padding: 14 }}>
        <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-2.5">
          STATUS DAS FATURAS
        </div>
        <div className="flex items-center gap-3.5">
          <svg viewBox="-1.2 -1.2 2.4 2.4" width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            {slices ? (
              slices.map((s, i) => (s ? <path key={i} d={s.d} fill={s.color} /> : null))
            ) : (
              <circle r="1" fill="hsl(var(--hv-line))" />
            )}
          </svg>
          <div className="flex-1 flex flex-col gap-2">
            {[
              { l: "Pagas", v: `${pagasPct}%`, c: "hsl(var(--hv-leaf))" },
              { l: "Em aberto", v: `${abertasPct}%`, c: "hsl(var(--hv-amber))" },
              { l: "Vencidas", v: `${vencidasPct}%`, c: "hsl(var(--hv-coral))" },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: x.c }}
                />
                <span className="flex-1 text-xs font-medium">{x.l}</span>
                <span className="text-[13px] font-bold font-mono">{x.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* inadimplentes */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
        Inadimplentes · ação rápida
      </h3>
      <div className="hv-card overflow-hidden">
        {inadimplentes.length === 0 ? (
          <div className="px-3.5 py-6 text-center">
            <div className="text-[13px] font-semibold text-hv-leaf">Nenhum inadimplente</div>
            <div className="text-[11px] text-hv-text-3 mt-1">
              Todas as faturas em dia neste período.
            </div>
          </div>
        ) : (
          inadimplentes.slice(0, 8).map((a, i, arr) => {
            const cor = a.days_late > 5 ? "hsl(var(--hv-coral))" : "hsl(var(--hv-amber))";
            const corBg = a.days_late > 5 ? "#FF6B4A" : "#F2B544";
            const initial = getInitial(a.full_name || "?");
            return (
              <div
                key={a.student_id}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3",
                  i < arr.length - 1 && "border-b border-hv-line",
                )}
              >
                <div
                  className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-white"
                  style={{ background: COLORS_INAD[i % COLORS_INAD.length] || corBg }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold truncate">
                    {a.full_name || "Aluno sem nome"}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: cor }}>
                    venceu há {a.days_late} dia{a.days_late === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-sm">
                    {formatBRL(a.amount_cents)}
                  </div>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      type="button"
                      className="w-[26px] h-[26px] rounded-md grid place-items-center"
                      style={{
                        background: "hsl(var(--hv-foam))",
                        color: "hsl(var(--hv-navy))",
                      }}
                    >
                      <HVIcon name="bell" size={12} />
                    </button>
                    <button
                      type="button"
                      className="w-[26px] h-[26px] rounded-md grid place-items-center bg-hv-leaf text-white"
                    >
                      <HVIcon name="check" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageScaffold>
  );
}
