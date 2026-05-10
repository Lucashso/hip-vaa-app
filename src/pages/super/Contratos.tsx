// SuperAdmin · Contratos de serviço — fiel ao super-extras.jsx HVSuperContratos.

import { SuperShell } from "@/components/SuperShell";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperContratos } from "@/hooks/useSuper";
import { formatBRL, getInitial } from "@/lib/utils";

const TENANT_COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#F2B544", "#7B2D9F", "#25C7E5"];

function statusStyle(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "signed" || s === "vigente") {
    return { bg: "hsl(var(--hv-leaf) / 0.15)", color: "hsl(var(--hv-leaf))", label: "Vigente" };
  }
  if (s === "pending" || s === "aguarda" || s === "awaiting") {
    return {
      bg: "hsl(var(--hv-amber) / 0.18)",
      color: "hsl(var(--hv-amber))",
      label: "Aguarda assinatura",
    };
  }
  if (s === "draft" || s === "negociando" || s === "negotiating") {
    return {
      bg: "hsl(var(--hv-blue) / 0.18)",
      color: "hsl(var(--hv-blue))",
      label: "Em negociação",
    };
  }
  if (s === "expiring" || s === "expired" || s === "cancelled") {
    return {
      bg: "hsl(var(--hv-coral) / 0.18)",
      color: "hsl(var(--hv-coral))",
      label: status === "expired" ? "Expirado" : "Vencendo",
    };
  }
  return { bg: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))", label: status ?? "—" };
}

const TEMPLATES = [
  { l: "Franquia Standard · 5y", v: "v3.1" },
  { l: "Franquia Premium · 10y", v: "v2.4" },
  { l: "Carta de intenção", v: "v1.8" },
  { l: "Termo de uso da marca", v: "v4.0" },
];

export default function SuperContratos() {
  const { data, isLoading } = useSuperContratos();

  if (isLoading) return <Loader />;
  const rows = data || [];
  const pendingSignature = rows.find((r) => (r.status || "").toLowerCase() === "pending");

  return (
    <SuperShell
      active="Contratos"
      sub="CONTRATOS DE SERVIÇO"
      title="Franquias & licenças"
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
          Novo contrato
        </button>
      }
    >
      {/* Tabela */}
      <div className="hv-card" style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "hsl(var(--hv-text-3))",
              fontSize: 13,
            }}
          >
            Nenhum contrato cadastrado.
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }}>
                {["FILIAL", "TIPO", "STATUS", "VIGÊNCIA", "ROYALTY/MÊS", "AÇÕES"].map((h, i) => (
                  <th
                    key={h}
                    className="hv-mono"
                    style={{
                      textAlign: i >= 4 ? "right" : "left",
                      padding: "12px 18px",
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
              {rows.map((r, i) => {
                const st = statusStyle(r.status);
                const vigencia =
                  r.starts_at || r.ends_at
                    ? `${r.starts_at ? new Date(r.starts_at).toLocaleDateString("pt-BR") : "—"} → ${r.ends_at ? new Date(r.ends_at).toLocaleDateString("pt-BR") : "—"}`
                    : "—";
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid hsl(var(--hv-line))" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: TENANT_COLORS[i % TENANT_COLORS.length],
                            color: "white",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                          }}
                        >
                          {getInitial(r.tenant_name)}
                        </div>
                        <span style={{ fontWeight: 700 }}>{r.tenant_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", color: "hsl(var(--hv-text-2))" }}>
                      {r.kind === "franchise" ? "Franquia" : "Serviço SaaS"}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: st.bg,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "hsl(var(--hv-text-2))",
                      }}
                    >
                      {vigencia}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}
                    >
                      {r.monthly_amount_cents != null
                        ? formatBRL(r.monthly_amount_cents)
                        : r.royalty_label}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
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
                        Ver
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
                        Renovar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Card destaque assinatura + templates */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14 }}>
        <div
          className="hv-card"
          style={{
            padding: 20,
            background: "linear-gradient(135deg, #061826, #1B6FB0)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 400 160"
            style={{ position: "absolute", inset: "auto 0 0 0", width: "100%", opacity: 0.25 }}
          >
            <path
              d="M0 100 Q100 70 200 100 T400 100 L400 160 L0 160Z"
              fill="rgba(37,199,229,0.5)"
            />
          </svg>
          <div className="hv-mono" style={{ fontSize: 10, opacity: 0.75, letterSpacing: 1.4 }}>
            PRÓXIMA ASSINATURA · {pendingSignature ? "1 PENDENTE" : "TUDO EM DIA"}
          </div>
          <h3
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 22,
              marginTop: 4,
              color: "white",
            }}
          >
            {pendingSignature
              ? `${pendingSignature.tenant_name} · Aguardando assinatura`
              : "Sem assinaturas pendentes"}
          </h3>
          <p
            style={{
              fontSize: 12,
              opacity: 0.85,
              marginTop: 6,
              lineHeight: 1.5,
              maxWidth: 320,
            }}
          >
            {pendingSignature
              ? "Contrato gerado, aguardando assinatura digital do franqueado e contador. Após assinatura, libera setup do tenant."
              : "Todos os contratos da rede estão vigentes e assinados."}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "hsl(var(--hv-cyan))",
                color: "hsl(var(--hv-ink))",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              Reenviar p/ assinatura
            </button>
            <button
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Ver PDF
            </button>
          </div>
        </div>

        <div className="hv-card" style={{ padding: 20 }}>
          <div
            className="hv-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.4,
              fontWeight: 700,
            }}
          >
            TEMPLATES DE CONTRATO
          </div>
          {TEMPLATES.map((t, i) => (
            <div
              key={t.l}
              style={{
                padding: "10px 0",
                borderBottom: i < TEMPLATES.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "hsl(var(--hv-foam))",
                  color: "hsl(var(--hv-navy))",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <HVIcon name="credit" size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t.l}</div>
                <div
                  className="hv-mono"
                  style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", marginTop: 2 }}
                >
                  {t.v}
                </div>
              </div>
              <HVIcon name="chevron-right" size={16} color="hsl(var(--hv-text-3))" />
            </div>
          ))}
        </div>
      </div>
    </SuperShell>
  );
}
