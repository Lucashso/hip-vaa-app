// SuperAdmin · Configurações da plataforma — fiel ao super-extras2.jsx HVSuperConfig.

import { useState } from "react";
import { SuperShell } from "@/components/SuperShell";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";

const SECTIONS: { l: string; ic: HVIconName }[] = [
  { l: "Geral", ic: "settings" },
  { l: "Gateways", ic: "credit" },
  { l: "NF-e", ic: "wallet" },
  { l: "E-mail", ic: "share" },
  { l: "Segurança", ic: "user" },
];

const GATEWAYS = [
  {
    n: "Asaas",
    on: true,
    env: "produção",
    key: "asaas_prod_XXXXX...4A2B",
    c: "#1B6FB0",
    lg: "A",
  },
  { n: "MercadoPago", on: false, env: "sandbox", key: "—", c: "#F2B544", lg: "M" },
];

const GERAL = [
  {
    l: "Modo manutenção",
    on: false,
    d: "Bloqueia acesso de todos os apps",
  },
  { l: "Fuso horário padrão", v: "America/Sao_Paulo" },
  { l: "Idioma padrão", v: "Português (pt-BR)" },
  { l: "Notificações por e-mail", on: true },
];

export default function SuperConfig() {
  const [active, setActive] = useState("Gateways");

  return (
    <SuperShell active="Configurações" sub="PLATAFORMA" title="Configurações da plataforma">
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18 }}>
        {/* Sidebar interno */}
        <div className="hv-card" style={{ padding: 8, alignSelf: "start" }}>
          {SECTIONS.map((s) => {
            const on = s.l === active;
            return (
              <button
                key={s.l}
                onClick={() => setActive(s.l)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: on ? "hsl(var(--hv-foam))" : "transparent",
                  color: on ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-2))",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <HVIcon name={s.ic} size={15} />
                {s.l}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>
          <div className="hv-card" style={{ padding: 20 }}>
            <div
              className="hv-mono"
              style={{
                fontSize: 10,
                color: "hsl(var(--hv-text-3))",
                letterSpacing: 1.2,
                fontWeight: 700,
              }}
            >
              GATEWAYS DE PAGAMENTO
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
                marginTop: 4,
                marginBottom: 14,
                fontWeight: 700,
              }}
            >
              Asaas & MercadoPago
            </h3>

            {GATEWAYS.map((g) => (
              <div
                key={g.n}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid hsl(var(--hv-line))",
                  marginBottom: 10,
                  background: g.on ? "hsl(var(--hv-foam))" : "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: g.c,
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                    }}
                  >
                    {g.lg}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{g.n}</div>
                    <div
                      className="hv-mono"
                      style={{
                        fontSize: 10,
                        color: "hsl(var(--hv-text-3))",
                        marginTop: 2,
                        letterSpacing: 0.6,
                      }}
                    >
                      {g.env}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 42,
                      height: 24,
                      borderRadius: 12,
                      background: g.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "white",
                        transform: g.on ? "translateX(18px)" : "none",
                        transition: "transform 150ms",
                      }}
                    />
                  </div>
                </div>
                {g.on && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "white",
                      border: "1px dashed hsl(var(--hv-cyan))",
                    }}
                  >
                    <div
                      className="hv-mono"
                      style={{
                        fontSize: 10,
                        color: "hsl(var(--hv-text-3))",
                        letterSpacing: 0.8,
                      }}
                    >
                      API KEY
                    </div>
                    <div
                      className="hv-mono"
                      style={{
                        fontSize: 12,
                        color: "hsl(var(--hv-navy))",
                        marginTop: 2,
                        fontWeight: 600,
                      }}
                    >
                      {g.key}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hv-card" style={{ padding: 20, marginTop: 14 }}>
            <div
              className="hv-mono"
              style={{
                fontSize: 10,
                color: "hsl(var(--hv-text-3))",
                letterSpacing: 1.2,
                fontWeight: 700,
              }}
            >
              GERAL
            </div>
            {GERAL.map((r, i) => (
              <div
                key={r.l}
                style={{
                  padding: "12px 0",
                  borderTop: i > 0 ? "1px solid hsl(var(--hv-line))" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.l}</div>
                  {"d" in r && r.d && (
                    <div
                      style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 2 }}
                    >
                      {r.d}
                    </div>
                  )}
                  {"v" in r && r.v && (
                    <div
                      className="hv-mono"
                      style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 2 }}
                    >
                      {r.v}
                    </div>
                  )}
                </div>
                {"on" in r && r.on !== undefined ? (
                  <div
                    style={{
                      width: 42,
                      height: 24,
                      borderRadius: 12,
                      background: r.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "white",
                        transform: r.on ? "translateX(18px)" : "none",
                        transition: "transform 150ms",
                      }}
                    />
                  </div>
                ) : (
                  <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SuperShell>
  );
}
