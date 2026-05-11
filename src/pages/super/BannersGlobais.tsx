// SuperAdmin · Banners globais — fiel ao super-extras2.jsx HVSuperBannersGlobais.

import { SuperPageHeader } from "@/components/SuperPageHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useSuperBanners, type SuperBanner } from "@/hooks/useSuper";

const COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#F2B544", "#7B2D9F", "#25C7E5"];

function periodLabel(b: SuperBanner): string {
  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      : "—";
  return `${fmt(b.starts_at)} → ${fmt(b.ends_at)}`;
}

function isScheduled(b: SuperBanner): boolean {
  if (!b.starts_at) return false;
  return new Date(b.starts_at) > new Date();
}

export default function SuperBannersGlobais() {
  const { data, isLoading } = useSuperBanners();
  if (isLoading) return <Loader />;
  const banners = data || [];

  return (
    <SuperPageHeader
      sub="EXIBIDO EM TODOS OS APPS"
      title="Banners globais"
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
          Novo banner
        </button>
      }
    >
      {/* Aviso */}
      <div
        className="hv-card"
        style={{
          padding: 14,
          marginBottom: 14,
          background: "hsl(var(--hv-foam))",
          border: "1px solid hsl(var(--hv-cyan) / 0.3)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <HVIcon name="zap" size={18} color="hsl(var(--hv-navy))" />
          <div style={{ fontSize: 13, color: "hsl(var(--hv-navy))", fontWeight: 500 }}>
            Banners aqui aparecem em <b>todas as filiais</b>. Para banner específico de uma filial,
            use o admin local.
          </div>
        </div>
      </div>

      {/* Grid */}
      {banners.length === 0 ? (
        <div className="hv-card" style={{ padding: 30, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "hsl(var(--hv-text-2))" }}>
            Nenhum banner global cadastrado.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {banners.map((b, i) => {
            const color = COLORS[i % COLORS.length];
            const scheduled = isScheduled(b);
            return (
              <div key={b.id} className="hv-card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  style={{
                    height: 110,
                    background: b.image_url
                      ? `linear-gradient(135deg, ${color}, #061826), url(${b.image_url})`
                      : `linear-gradient(135deg, ${color}, #061826)`,
                    backgroundSize: "cover",
                    position: "relative",
                  }}
                >
                  <svg
                    viewBox="0 0 400 110"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0.5,
                    }}
                  >
                    <path
                      d="M0 80 Q100 60 200 80 T400 80 L400 110 L0 110Z"
                      fill="white"
                    />
                  </svg>
                  {scheduled && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.85)",
                        color,
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      AGENDADO
                    </span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{b.title}</div>
                  <div
                    className="hv-mono"
                    style={{
                      fontSize: 10,
                      color: "hsl(var(--hv-text-3))",
                      marginTop: 4,
                      letterSpacing: 0.6,
                    }}
                  >
                    {periodLabel(b)} · todos os tenants
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid hsl(var(--hv-line))",
                      fontSize: 11,
                    }}
                  >
                    <span>
                      <span style={{ color: "hsl(var(--hv-text-3))" }}>Status</span>{" "}
                      <b style={{ color: b.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))" }}>
                        {b.active ? "Ativo" : "Pausado"}
                      </b>
                    </span>
                    {b.link_label && (
                      <span>
                        <span style={{ color: "hsl(var(--hv-text-3))" }}>CTA</span>{" "}
                        <b>{b.link_label}</b>
                      </span>
                    )}
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
