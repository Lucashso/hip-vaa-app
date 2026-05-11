// SuperAdmin · Financeiro da plataforma — fiel ao super-extras.jsx HVSuperFinanceiro.

import { SuperPageHeader } from "@/components/SuperPageHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperFinanceiro } from "@/hooks/useSuper";
import { formatBRL, getInitial } from "@/lib/utils";

const TENANT_COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#F2B544", "#7B2D9F", "#25C7E5"];

export default function SuperFinanceiro() {
  const { data, isLoading } = useSuperFinanceiro();

  if (isLoading || !data) return <Loader />;

  const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const kpis = [
    {
      l: "RECEITA SAAS · CONFIRMADA",
      v: formatBRL(data.confirmed_cents, { compact: true }),
      d: data.confirmed_cents > 0 ? "no mês" : "—",
      c: "hsl(var(--hv-leaf))",
      icon: "trend" as const,
    },
    {
      l: "A RECEBER · MÊS",
      v: formatBRL(data.pending_cents, { compact: true }),
      d: `${data.pending_tenants_count} filiais`,
      c: "hsl(var(--hv-blue))",
      icon: "wallet" as const,
    },
    {
      l: "INADIMPLÊNCIA",
      v: formatBRL(data.overdue_cents, { compact: true }),
      d: `${data.overdue_tenants.length} filiais`,
      c: "hsl(var(--hv-coral))",
      icon: "x" as const,
    },
    {
      l: "CHURN MÊS",
      v: "—",
      d: "em breve",
      c: "hsl(var(--hv-leaf))",
      icon: "users" as const,
    },
  ];

  const maxFlow = Math.max(
    1,
    ...data.daily_flow.map((d) => Math.max(d.in_cents, d.out_cents)),
  );

  return (
    <SuperPageHeader
      sub="FINANCEIRO DA PLATAFORMA"
      title={`Receita SaaS · ${monthLabel}`}
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              background: "white",
              border: "1px solid hsl(var(--hv-line))",
              fontSize: 12,
              fontWeight: 600,
              color: "hsl(var(--hv-text))",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <HVIcon name="filter" size={14} />
            {monthLabel}
          </button>
          <button
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              background: "hsl(var(--hv-navy))",
              color: "white",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <HVIcon name="arrow-up-right" size={14} />
            Exportar
          </button>
        </div>
      }
    >
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.l} className="hv-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                className="hv-mono"
                style={{ fontSize: 10, letterSpacing: 1, color: "hsl(var(--hv-text-3))", fontWeight: 700 }}
              >
                {k.l}
              </span>
              <HVIcon name={k.icon} size={14} color={k.c} />
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                marginTop: 6,
                color: "hsl(var(--hv-text))",
              }}
            >
              {k.v}
            </div>
            <div style={{ fontSize: 11, color: k.c, fontWeight: 600, marginTop: 2 }}>{k.d}</div>
          </div>
        ))}
      </div>

      {/* Gráfico fluxo diário */}
      <div className="hv-card" style={{ padding: 20, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              className="hv-mono"
              style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}
            >
              FLUXO DIÁRIO · MÊS
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              Entradas vs saídas
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{ width: 10, height: 10, borderRadius: 5, background: "hsl(var(--hv-cyan))" }}
              />
              Entradas
            </span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{ width: 10, height: 10, borderRadius: 5, background: "hsl(var(--hv-coral))" }}
              />
              Saídas
            </span>
          </div>
        </div>
        <svg viewBox="0 0 800 200" style={{ width: "100%", height: 200 }}>
          {data.daily_flow.map((d, i) => {
            const x = 20 + i * 25;
            const hIn = (d.in_cents / maxFlow) * 150;
            const hOut = (d.out_cents / maxFlow) * 150;
            return (
              <g key={i}>
                {hIn > 0 && <rect x={x} y={180 - hIn} width={9} height={hIn} fill="#25C7E5" rx={2} />}
                {hOut > 0 && (
                  <rect
                    x={x + 10}
                    y={180 - hOut}
                    width={9}
                    height={hOut}
                    fill="#FF6B4A"
                    rx={2}
                    opacity={0.85}
                  />
                )}
              </g>
            );
          })}
          <line x1={10} y1={180} x2={790} y2={180} stroke="hsl(var(--hv-line))" strokeWidth={1} />
        </svg>
      </div>

      {/* Tabela inadimplentes */}
      <div className="hv-card" style={{ padding: 0, marginTop: 14, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid hsl(var(--hv-line))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="hv-mono"
              style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}
            >
              FILIAIS INADIMPLENTES
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {data.overdue_tenants.length} unidades · {formatBRL(data.overdue_cents)} em aberto
            </div>
          </div>
          <button
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "hsl(var(--hv-bg))",
              border: "1px solid hsl(var(--hv-line))",
              fontSize: 12,
              fontWeight: 600,
              color: "hsl(var(--hv-text))",
            }}
          >
            Notificar todos
          </button>
        </div>

        {data.overdue_tenants.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "hsl(var(--hv-text-3))",
              fontSize: 13,
            }}
          >
            Nenhuma filial inadimplente este mês.
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }}>
                {["FILIAL", "PLANO", "VENCIMENTO", "VALOR", "AÇÕES"].map((h, i) => (
                  <th
                    key={h}
                    className="hv-mono"
                    style={{
                      textAlign: i >= 3 ? "right" : "left",
                      padding: "10px 16px",
                      fontWeight: 600,
                      fontSize: 10,
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.overdue_tenants.map((r, i) => (
                <tr key={r.tenant_id} style={{ borderTop: "1px solid hsl(var(--hv-line))" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: TENANT_COLORS[i % TENANT_COLORS.length],
                          color: "white",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        {getInitial(r.tenant_name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{r.tenant_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      className="hv-chip"
                      style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                    >
                      {r.plan ?? "—"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: 12,
                      color: "hsl(var(--hv-coral))",
                      fontWeight: 600,
                    }}
                  >
                    {r.days_overdue > 0 ? `${r.days_overdue} dias atraso` : "vencido"}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                    }}
                  >
                    {formatBRL(r.amount_cents)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "hsl(var(--hv-bg))",
                        border: "1px solid hsl(var(--hv-line))",
                        fontSize: 11,
                        fontWeight: 600,
                        marginRight: 4,
                        color: "hsl(var(--hv-text))",
                      }}
                    >
                      Notificar
                    </button>
                    <button
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "hsl(var(--hv-navy))",
                        color: "white",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SuperPageHeader>
  );
}
