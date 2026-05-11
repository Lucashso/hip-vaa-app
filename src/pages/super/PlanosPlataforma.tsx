// SuperAdmin · Planos da plataforma — fiel ao super-extras2.jsx HVSuperPlanosPlataforma.

import { SuperPageHeader } from "@/components/SuperPageHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperPlanosPlataforma, type SuperPlatformPlan } from "@/hooks/useSuper";
import { formatBRL } from "@/lib/utils";

const PLAN_COLORS: Record<string, string> = {
  starter: "#1B6FB0",
  pro: "#25C7E5",
  professional: "#25C7E5",
  enterprise: "#0E3A5F",
};

function colorForPlan(p: SuperPlatformPlan): string {
  const key = (p.slug || p.name).toLowerCase();
  return PLAN_COLORS[key] || "#1B6FB0";
}

const COMPARATIVO_ROWS = [
  ["Alunos", "50", "250", "∞"],
  ["Admins", "1", "5", "∞"],
  ["Loja", "✓", "✓", "✓"],
  ["Indicações", "—", "✓", "✓"],
  ["Comunidade", "—", "✓", "✓"],
  ["API", "—", "—", "✓"],
  ["White-label", "—", "—", "✓"],
  ["SLA", "—", "99%", "99.9%"],
];

export default function SuperPlanosPlataforma() {
  const { data, isLoading } = useSuperPlanosPlataforma();

  if (isLoading) return <Loader />;
  const plans = data || [];

  // marca o "Pro" / 2º card como popular (ou o do meio)
  const popularIdx = plans.length >= 3 ? 1 : -1;

  return (
    <SuperPageHeader
      sub="PLANOS DA PLATAFORMA"
      title="Planos de assinatura"
      action={
        <button
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "hsl(var(--hv-navy))",
            color: "white",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <HVIcon name="plus" size={16} stroke={2.4} />
          Novo plano
        </button>
      }
    >
      {/* Cards de plano */}
      {plans.length === 0 ? (
        <div className="hv-card" style={{ padding: 30, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "hsl(var(--hv-text-2))" }}>
            Nenhum plano cadastrado ainda. Cadastre planos para começar a cobrar tenants.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {plans.map((p, i) => {
            const isPopular = i === popularIdx;
            const color = colorForPlan(p);
            return (
              <div
                key={p.id}
                className="hv-card"
                style={{
                  padding: 20,
                  position: "relative",
                  border: isPopular
                    ? "2px solid hsl(var(--hv-cyan))"
                    : "1px solid hsl(var(--hv-line))",
                }}
              >
                {isPopular && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      left: 18,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "hsl(var(--hv-cyan))",
                      color: "hsl(var(--hv-ink))",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1,
                    }}
                  >
                    MAIS POPULAR
                  </span>
                )}
                <div
                  className="hv-mono"
                  style={{
                    fontSize: 10,
                    color,
                    letterSpacing: 1.6,
                    fontWeight: 700,
                  }}
                >
                  {p.name.toUpperCase()}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
                  <span
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 36,
                      fontWeight: 800,
                      color: "hsl(var(--hv-text))",
                    }}
                  >
                    {formatBRL(p.price_cents)}
                  </span>
                  <span style={{ fontSize: 13, color: "hsl(var(--hv-text-3))" }}>/mês</span>
                </div>
                <div
                  className="hv-mono"
                  style={{
                    fontSize: 10,
                    color: "hsl(var(--hv-text-3))",
                    marginTop: 4,
                    letterSpacing: 0.8,
                  }}
                >
                  {p.active_tenants} TENANTS ATIVOS
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {p.features.length === 0 ? (
                    <div style={{ fontSize: 12, color: "hsl(var(--hv-text-3))" }}>
                      {p.description ?? "Sem features cadastradas"}
                    </div>
                  ) : (
                    p.features.map((f, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                          fontSize: 12,
                        }}
                      >
                        <HVIcon name="check" size={14} color={color} stroke={2.4} />
                        <span>{f}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparativo */}
      <div className="hv-card" style={{ padding: 0, marginTop: 18, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid hsl(var(--hv-line))" }}>
          <div
            className="hv-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            COMPARATIVO DE FEATURES
          </div>
        </div>
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }}>
              <th
                className="hv-mono"
                style={{
                  textAlign: "left",
                  padding: "10px 18px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                FEATURE
              </th>
              <th
                className="hv-mono"
                style={{ padding: 10, fontSize: 10, fontWeight: 600, letterSpacing: 1 }}
              >
                STARTER
              </th>
              <th
                className="hv-mono"
                style={{
                  padding: 10,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: "hsl(var(--hv-cyan))",
                }}
              >
                PRO
              </th>
              <th
                className="hv-mono"
                style={{ padding: 10, fontSize: 10, fontWeight: 600, letterSpacing: 1 }}
              >
                ENTERPRISE
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVO_ROWS.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid hsl(var(--hv-line))" }}>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>{r[0]}</td>
                <td
                  style={{
                    padding: 12,
                    textAlign: "center",
                    color: "hsl(var(--hv-text-2))",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {r[1]}
                </td>
                <td
                  style={{
                    padding: 12,
                    textAlign: "center",
                    color: "hsl(var(--hv-text))",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    background: "hsl(var(--hv-cyan) / 0.06)",
                  }}
                >
                  {r[2]}
                </td>
                <td
                  style={{
                    padding: 12,
                    textAlign: "center",
                    color: "hsl(var(--hv-text-2))",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {r[3]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SuperPageHeader>
  );
}
