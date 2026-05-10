// SuperAdmin · Push stats — fiel ao super-extras2.jsx HVSuperPushStats.

import { SuperShell } from "@/components/SuperShell";
import { Loader } from "@/components/Loader";
import { useSuperPushStats } from "@/hooks/useSuper";

export default function SuperPushStats() {
  const { data, isLoading } = useSuperPushStats();
  if (isLoading || !data) return <Loader />;

  const kpis = [
    {
      l: "ASSINATURAS",
      v: data.subscriptions_count.toLocaleString("pt-BR"),
      d: "ativas",
      c: "hsl(var(--hv-leaf))",
    },
    {
      l: "ENVIADAS · MÊS",
      v: data.sent_month.toLocaleString("pt-BR"),
      d: `${data.failed_month} falhas`,
      c: "hsl(var(--hv-blue))",
    },
    {
      l: "TAXA DE ENTREGA",
      v: `${data.delivery_rate.toFixed(1)}%`,
      d: `${data.delivered_month} entregues`,
      c: "hsl(var(--hv-leaf))",
    },
    {
      l: "TAXA DE CLIQUE",
      v: `${data.click_rate.toFixed(1)}%`,
      d: "no mês",
      c: "hsl(var(--hv-cyan))",
    },
  ];

  const maxDaily = Math.max(1, ...data.daily_sends.map((d) => d.count));

  return (
    <SuperShell
      active="Push"
      sub="NOTIFICAÇÕES"
      title="Push notifications"
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
          }}
        >
          Enviar push
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
            <div style={{ fontSize: 11, color: k.c, fontWeight: 700, marginTop: 2 }}>{k.d}</div>
          </div>
        ))}
      </div>

      {/* Gráfico envios diários */}
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
          ENVIOS DIÁRIOS · {data.daily_sends.length} DIAS
        </div>
        <svg viewBox="0 0 600 140" style={{ width: "100%", marginTop: 10 }}>
          {data.daily_sends.map((d, i) => {
            const h = (d.count / maxDaily) * 100;
            return (
              <rect
                key={i}
                x={10 + i * 20}
                y={120 - h}
                width={14}
                height={h}
                fill="hsl(var(--hv-cyan))"
                rx={2}
              />
            );
          })}
          <line x1={0} y1={120} x2={600} y2={120} stroke="hsl(var(--hv-line))" />
        </svg>
      </div>

      {/* Logs */}
      <div className="hv-card" style={{ padding: 0, marginTop: 14, overflow: "hidden" }}>
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
            LOGS DE CAMPANHAS · MÊS
          </div>
        </div>
        {data.recent_logs.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "hsl(var(--hv-text-3))",
              fontSize: 13,
            }}
          >
            Nenhum envio neste mês ainda.
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }}>
                {["DATA", "TIPO", "TÍTULO", "STATUS"].map((h, i) => (
                  <th
                    key={h}
                    className="hv-mono"
                    style={{
                      textAlign: i === 3 ? "right" : "left",
                      padding: "10px 18px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_logs.map((l) => {
                const status = (l.status || "").toLowerCase();
                const statusColor =
                  status === "sent" || status === "delivered"
                    ? "hsl(var(--hv-leaf))"
                    : status === "failed"
                      ? "hsl(var(--hv-coral))"
                      : status === "clicked"
                        ? "hsl(var(--hv-cyan))"
                        : "hsl(var(--hv-text-3))";
                return (
                  <tr key={l.id} style={{ borderTop: "1px solid hsl(var(--hv-line))" }}>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "hsl(var(--hv-text-2))",
                      }}
                    >
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td style={{ padding: 12, fontWeight: 600 }}>
                      {l.notification_type ?? "—"}
                    </td>
                    <td style={{ padding: 12, color: "hsl(var(--hv-text-2))" }}>
                      {l.title ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        color: statusColor,
                      }}
                    >
                      {l.status ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </SuperShell>
  );
}
