// Admin · Pedidos da loja — lista pedidos + grade tamanhos.
// Baseado em admin-mobile.jsx HVAdminPedidosLoja.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { useAdminPedidos } from "@/hooks/useAdminPedidos";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

type Filter = "all" | "pending" | "confirmed" | "delivered";

const AVATAR_COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#7B2D9F", "#F2B544", "#25C7E5"];

function statusInfo(status: string): { label: string; color: string } {
  const s = status.toLowerCase();
  if (s === "delivered") return { label: "Entregue", color: "hsl(var(--hv-leaf))" };
  if (s === "paid" || s === "confirmed")
    return { label: "Confirmado", color: "hsl(var(--hv-blue))" };
  if (s === "cancelled" || s === "canceled")
    return { label: "Cancelado", color: "hsl(var(--hv-coral))" };
  return { label: "Em separação", color: "hsl(var(--hv-amber))" };
}

function bucket(status: string): Filter {
  const s = status.toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "paid" || s === "confirmed") return "confirmed";
  if (s === "cancelled" || s === "canceled") return "all";
  return "pending";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export default function AdminPedidosLoja() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: pedidos = [], isLoading } = useAdminPedidos(tenantId);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const total = pedidos.length;
    const pending = pedidos.filter((o) => bucket(o.status) === "pending").length;
    const confirmed = pedidos.filter((o) => bucket(o.status) === "confirmed").length;
    const delivered = pedidos.filter((o) => bucket(o.status) === "delivered").length;
    return { total, pending, confirmed, delivered };
  }, [pedidos]);

  const filtered = useMemo(() => {
    if (filter === "all") return pedidos;
    return pedidos.filter((o) => bucket(o.status) === filter);
  }, [pedidos, filter]);

  const sizeGrid = useMemo(() => {
    const month = new Date();
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const map: Record<string, { P: number; M: number; G: number; GG: number }> = {};
    pedidos
      .filter((o) => new Date(o.created_at) >= start)
      .forEach((o) => {
        const name = o.product?.name || "Produto";
        if (!map[name]) map[name] = { P: 0, M: 0, G: 0, GG: 0 };
        const sz = (o.size || "").toUpperCase();
        if (sz === "P" || sz === "M" || sz === "G" || sz === "GG") {
          map[name][sz] += o.quantity;
        }
      });
    return Object.entries(map).slice(0, 5);
  }, [pedidos]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Pedidos da loja" sub={`${counts.total} ESTE MÊS`} />
      <Chips
        items={[
          { l: `Todos · ${counts.total}`, on: filter === "all", onClick: () => setFilter("all") },
          {
            l: `Pendentes · ${counts.pending}`,
            on: filter === "pending",
            onClick: () => setFilter("pending"),
          },
          {
            l: `Confirmados · ${counts.confirmed}`,
            on: filter === "confirmed",
            onClick: () => setFilter("confirmed"),
          },
          {
            l: `Entregues · ${counts.delivered}`,
            on: filter === "delivered",
            onClick: () => setFilter("delivered"),
          },
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
                Nenhum pedido por enquanto.
              </div>
            ) : (
              filtered.map((o, i) => {
                const cl = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const name = o.customer_name || "—";
                const initial = (name[0] || "?").toUpperCase();
                const info = statusInfo(o.status);
                return (
                  <div
                    key={o.id}
                    className="hv-card mb-2 flex gap-3 items-center"
                    style={{ padding: 12 }}
                  >
                    <div
                      className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-bold"
                      style={{ background: cl, fontFamily: "var(--hv-font-display)" }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[13px] font-bold truncate">{name}</span>
                        <span className="hv-mono text-[10px] text-hv-text-3 shrink-0">
                          #{o.id.slice(0, 4)}
                        </span>
                      </div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                        {o.product?.name || "Produto"} · {formatDate(o.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[15px] font-bold">
                        {formatBRL(o.amount_cents)}
                      </div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: info.color }}>
                        {info.label}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sizeGrid.length > 0 && (
              <div className="hv-card mt-2" style={{ padding: 14 }}>
                <div
                  className="hv-mono text-[10px] font-bold text-hv-text-3 mb-2"
                  style={{ letterSpacing: "0.12em" }}
                >
                  GRADE DE TAMANHOS · MÊS ATUAL
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-hv-text-3">
                      <th className="text-left py-1 font-semibold">Produto</th>
                      <th>P</th>
                      <th>M</th>
                      <th>G</th>
                      <th>GG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGrid.map(([name, r]) => (
                      <tr key={name} className="border-t border-hv-line">
                        <td className="py-2 font-medium">{name}</td>
                        <td className="text-center hv-mono font-semibold">{r.P}</td>
                        <td className="text-center hv-mono font-semibold">{r.M}</td>
                        <td className="text-center hv-mono font-semibold">{r.G}</td>
                        <td className="text-center hv-mono font-semibold">{r.GG}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
