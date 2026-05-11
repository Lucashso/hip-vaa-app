// SuperAdmin · Analytics consolidado — fiel ao super-extras2.jsx HVSuperAnalytics.
// Métricas são placeholders/derivadas pois não há tabela de eventos agregados ainda.

import { Fragment } from "react";
import { SuperPageHeader } from "@/components/SuperPageHeader";
import { Loader } from "@/components/Loader";
import { useSuperTenants } from "@/hooks/useSuper";

export default function SuperAnalytics() {
  const { data: tenants = [], isLoading } = useSuperTenants();

  if (isLoading) return <Loader />;

  const totalStudents = tenants.reduce((s, t) => s + (t.students_count || 0), 0);

  const kpis = [
    { l: "DAU", v: Math.round(totalStudents * 0.4).toString(), d: "+8%" },
    { l: "CHECK-INS/DIA", v: Math.round(totalStudents * 0.3).toString(), d: "+12%" },
    { l: "SESSÕES TREINO", v: Math.round(totalStudents * 0.18).toString(), d: "+18%" },
    { l: "NPS", v: "78", d: "+4 pts" },
  ];

  const branchLines = tenants.slice(0, 3).map((t, i) => ({
    name: t.name,
    color: ["#1B6FB0", "#FF6B4A", "#2FB37A"][i] ?? "#25C7E5",
  }));

  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const dayBars = [28, 42, 38, 48, 56, 78, 62];

  return (
    <SuperPageHeader
      sub="MÉTRICAS DA REDE"
      title="Analytics consolidado"
      action={
        <button
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            background: "white",
            border: "1px solid hsl(var(--hv-line))",
            fontSize: 12,
            fontWeight: 600,
            color: "hsl(var(--hv-text))",
          }}
        >
          30 dias
        </button>
      }
    >
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.l} className="hv-card" style={{ padding: 16 }}>
            <div
              className="hv-mono"
              style={{
                fontSize: 10,
                color: "hsl(var(--hv-text-3))",
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              {k.l}
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                marginTop: 6,
              }}
            >
              {k.v}
            </div>
            <div
              style={{ fontSize: 11, color: "hsl(var(--hv-leaf))", fontWeight: 700, marginTop: 2 }}
            >
              {k.d}
            </div>
          </div>
        ))}
      </div>

      {/* Crescimento + dia da semana */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className="hv-card" style={{ padding: 18 }}>
          <div
            className="hv-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            CRESCIMENTO DE ALUNOS · POR FILIAL
          </div>
          <svg viewBox="0 0 500 200" style={{ width: "100%", marginTop: 10 }}>
            {[
              { c: "#1B6FB0", p: "M0 140 L 80 130 L 160 120 L 240 100 L 320 90 L 400 80 L 500 70" },
              { c: "#FF6B4A", p: "M0 160 L 80 150 L 160 145 L 240 130 L 320 125 L 400 115 L 500 100" },
              { c: "#2FB37A", p: "M0 180 L 80 175 L 160 170 L 240 160 L 320 155 L 400 145 L 500 130" },
            ].map((l, i) => (
              <path
                key={i}
                d={l.p}
                stroke={l.c}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            ))}
            <line x1="0" y1="190" x2="500" y2="190" stroke="hsl(var(--hv-line))" />
          </svg>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11 }}>
            {branchLines.length === 0 ? (
              <span style={{ color: "hsl(var(--hv-text-3))" }}>Sem filiais</span>
            ) : (
              branchLines.map((x) => (
                <span
                  key={x.name}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: x.color,
                    }}
                  />
                  {x.name}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="hv-card" style={{ padding: 18 }}>
          <div
            className="hv-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            CHECK-INS · DIA DA SEMANA
          </div>
          <svg viewBox="0 0 320 160" style={{ width: "100%", marginTop: 10 }}>
            {dayBars.map((v, i) => (
              <g key={i}>
                <rect
                  x={20 + i * 42}
                  y={140 - v}
                  width={28}
                  height={v}
                  fill={i === 5 ? "hsl(var(--hv-cyan))" : "hsl(var(--hv-blue))"}
                  rx="3"
                />
                <text
                  x={34 + i * 42}
                  y={155}
                  textAnchor="middle"
                  fontSize="9"
                  fill="hsl(var(--hv-text-3))"
                  fontFamily="JetBrains Mono"
                >
                  {dayLabels[i]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Heatmap */}
      <div className="hv-card" style={{ padding: 18, marginTop: 14 }}>
        <div
          className="hv-mono"
          style={{
            fontSize: 10,
            color: "hsl(var(--hv-text-3))",
            letterSpacing: 1.2,
            fontWeight: 700,
          }}
        >
          MAPA DE CALOR · HORÁRIO × DIA
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px repeat(7, 1fr)",
            gap: 4,
            marginTop: 12,
          }}
        >
          <div />
          {dayLabels.map((d, i) => (
            <div
              key={i}
              className="hv-mono"
              style={{ textAlign: "center", fontSize: 10, color: "hsl(var(--hv-text-3))" }}
            >
              {d}
            </div>
          ))}
          {["06:00", "07:00", "12:00", "17:00", "18:00", "19:00"].map((h, hi) => (
            <Fragment key={h}>
              <div
                className="hv-mono"
                style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", padding: "4px 0" }}
              >
                {h}
              </div>
              {Array.from({ length: 7 }).map((_, di) => {
                const base = hi === 0 || hi === 4 ? (di === 1 || di === 3 || di === 5 ? 90 : 50) : hi === 2 ? 30 : 65;
                const v = di === 6 && hi === 0 ? 95 : base;
                return (
                  <div
                    key={di}
                    style={{
                      height: 26,
                      borderRadius: 4,
                      background: `hsla(190, 80%, 50%, ${v / 100})`,
                    }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </SuperPageHeader>
  );
}
