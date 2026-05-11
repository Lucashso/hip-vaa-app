// SuperAdmin · Detalhe de uma filial — fiel ao super-extras2.jsx HVSuperTenantDetalhe.

import { useParams } from "react-router-dom";
import { SuperPageHeader } from "@/components/SuperPageHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperTenantDetalhe } from "@/hooks/useSuper";
import { formatBRL, getInitial } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  owner: "#1B6FB0",
  manager: "#FF6B4A",
  finance: "#2FB37A",
  coordinator: "#7B2D9F",
};

export default function SuperTenantDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSuperTenantDetalhe(id);

  if (isLoading) return <Loader />;

  if (!data) {
    return (
      <SuperPageHeader sub="FILIAL · DETALHE" title="Filial não encontrada">
        <div className="hv-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: "hsl(var(--hv-text-2))" }}>
            Não foi possível localizar essa filial.
          </p>
        </div>
      </SuperPageHeader>
    );
  }

  const planName = data.subscription?.plan ?? "—";
  const mrrLabel = data.mrr_cents > 0 ? formatBRL(data.mrr_cents) : "R$ 0";
  const outstandingLabel = data.outstanding_cents > 0 ? formatBRL(data.outstanding_cents) : "R$ 0";
  const kpis = [
    {
      l: "ALUNOS ATIVOS",
      v: String(data.active_students_count),
      d: `${data.students_count} total`,
      c: "hsl(var(--hv-leaf))",
    },
    { l: "MRR", v: mrrLabel, d: planName.toUpperCase(), c: "hsl(var(--hv-leaf))" },
    {
      l: "STATUS",
      v: data.active ? "Ativa" : "Inativa",
      d: data.contract?.status ?? "—",
      c: data.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-coral))",
    },
    {
      l: "INADIMPLÊNCIA",
      v: outstandingLabel,
      d: "em aberto",
      c: "hsl(var(--hv-coral))",
    },
  ];

  return (
    <SuperPageHeader
      sub="FILIAL · DETALHE"
      title={`Hip Va'a · ${data.name}`}
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
            }}
          >
            Suspender
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
            Entrar como admin
          </button>
        </div>
      }
    >
      {/* Header tenant */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "14px 18px",
          background: "white",
          borderRadius: 14,
          border: "1px solid hsl(var(--hv-line))",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#FF6B4A",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          {getInitial(data.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Hip Va'a · {data.name}</span>
            <span
              className="hv-chip"
              style={{ background: "hsl(var(--hv-blue) / 0.18)", color: "hsl(var(--hv-blue))" }}
            >
              {data.contract ? "franquia" : "tenant"}
            </span>
            <span
              className="hv-chip"
              style={{
                background: data.active ? "hsl(var(--hv-leaf) / 0.15)" : "hsl(var(--hv-coral) / 0.15)",
                color: data.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-coral))",
              }}
            >
              {data.active ? "ativa" : "inativa"}
            </span>
          </div>
          <div
            className="hv-mono"
            style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 4 }}
          >
            {data.slug ? `/${data.slug}` : "—"}
            {data.created_at
              ? ` · desde ${new Date(data.created_at).toLocaleDateString("pt-BR")}`
              : ""}
            {planName !== "—" ? ` · plano ${planName.toUpperCase()}` : ""}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 18,
          padding: "16px 0 8px",
          borderBottom: "1px solid hsl(var(--hv-line))",
          marginTop: 14,
        }}
      >
        {["Visão geral", "Financeiro", "Configurações", "Documentos"].map((t, i) => (
          <button
            key={t}
            style={{
              padding: "8px 0",
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-3))",
              borderBottom: i === 0 ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginTop: 14,
        }}
      >
        {kpis.map((k) => (
          <div key={k.l} className="hv-card" style={{ padding: 16 }}>
            <div
              className="hv-mono"
              style={{ fontSize: 10, letterSpacing: 1, color: "hsl(var(--hv-text-3))", fontWeight: 700 }}
            >
              {k.l}
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                marginTop: 6,
              }}
            >
              {k.v}
            </div>
            <div style={{ fontSize: 11, color: k.c, fontWeight: 700, marginTop: 2 }}>{k.d}</div>
          </div>
        ))}
      </div>

      {/* MRR chart + admins */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className="hv-card" style={{ padding: 18 }}>
          <div
            className="hv-mono"
            style={{ fontSize: 10, letterSpacing: 1.2, color: "hsl(var(--hv-text-3))", fontWeight: 700 }}
          >
            MRR · 6 MESES
          </div>
          <svg viewBox="0 0 600 160" style={{ width: "100%", marginTop: 8 }}>
            <defs>
              <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#25C7E5" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#25C7E5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 120 L 100 110 L 200 100 L 300 80 L 400 70 L 500 50 L 600 35 L 600 160 L 0 160Z"
              fill="url(#mrr-grad)"
            />
            <path
              d="M0 120 L 100 110 L 200 100 L 300 80 L 400 70 L 500 50 L 600 35"
              stroke="#25C7E5"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </div>

        <div className="hv-card" style={{ padding: 18 }}>
          <div
            className="hv-mono"
            style={{ fontSize: 10, letterSpacing: 1.2, color: "hsl(var(--hv-text-3))", fontWeight: 700 }}
          >
            ADMINISTRADORES
          </div>
          {data.admins.length === 0 ? (
            <div style={{ fontSize: 12, color: "hsl(var(--hv-text-3))", marginTop: 12 }}>
              Nenhum admin cadastrado.
            </div>
          ) : (
            data.admins.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: i > 0 ? "1px solid hsl(var(--hv-line))" : "none",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: ROLE_COLORS[a.role || ""] || "#1B6FB0",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  {getInitial(a.full_name)}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{a.full_name}</div>
                <span
                  className="hv-chip"
                  style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                >
                  {a.role ?? "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </SuperPageHeader>
  );
}
