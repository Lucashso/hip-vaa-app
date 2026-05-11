// SuperAdmin · Parceiros globais — fiel ao super-extras2.jsx HVSuperParceirosGlobais.

import { SuperPageHeader } from "@/components/SuperPageHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperParceiros } from "@/hooks/useSuper";
import { getInitial } from "@/lib/utils";

const COLORS = ["#1B6FB0", "#2FB37A", "#7B2D9F", "#25C7E5", "#7A4A1F", "#F2B544", "#FF6B4A"];

export default function SuperParceirosGlobais() {
  const { data, isLoading } = useSuperParceiros();
  if (isLoading) return <Loader />;
  const partners = data || [];

  return (
    <SuperPageHeader
      sub="DISPONÍVEIS PARA TODAS AS FILIAIS"
      title="Parceiros globais"
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
          Novo parceiro
        </button>
      }
    >
      {partners.length === 0 ? (
        <div className="hv-card" style={{ padding: 30, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "hsl(var(--hv-text-2))" }}>
            Nenhum parceiro global cadastrado.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {partners.map((p, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div
                key={p.id}
                className="hv-card"
                style={{ padding: 16, opacity: p.active ? 1 : 0.55 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: color,
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                    }}
                  >
                    {getInitial(p.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    {p.description && (
                      <span
                        className="hv-chip"
                        style={{
                          background: "hsl(var(--hv-bg))",
                          color: "hsl(var(--hv-text-2))",
                          marginTop: 4,
                          display: "inline-block",
                        }}
                      >
                        {p.description}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: p.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: "1px solid hsl(var(--hv-line))",
                  }}
                >
                  <div>
                    <div
                      className="hv-mono"
                      style={{ fontSize: 9, color: "hsl(var(--hv-text-3))", letterSpacing: 1 }}
                    >
                      FILIAIS
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontSize: 20,
                        fontWeight: 800,
                        marginTop: 2,
                      }}
                    >
                      {p.tenants_count}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="hv-mono"
                      style={{ fontSize: 9, color: "hsl(var(--hv-text-3))", letterSpacing: 1 }}
                    >
                      CHECK-INS
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontSize: 20,
                        fontWeight: 800,
                        marginTop: 2,
                        color: "hsl(var(--hv-cyan))",
                      }}
                    >
                      {p.checkins_count.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SuperPageHeader>
  );
}
