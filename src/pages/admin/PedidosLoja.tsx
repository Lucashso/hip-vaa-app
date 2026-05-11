// Admin · Pedidos da loja — listagem por status + update status.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { useAdminPedidos, useUpdateOrderStatus, ORDER_STATUSES } from "@/hooks/useAdminPedidos";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

type Filter = "all" | "pending" | "paid" | "processing" | "delivered" | "cancelled";

const AVATAR_COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#7B2D9F", "#F2B544", "#25C7E5"];

function statusInfo(status: string): { label: string; color: string } {
  const s = status.toLowerCase();
  if (s === "delivered") return { label: "Entregue", color: "hsl(var(--hv-leaf))" };
  if (s === "paid") return { label: "Pago", color: "hsl(var(--hv-blue))" };
  if (s === "processing")
    return { label: "Em processamento", color: "hsl(var(--hv-amber))" };
  if (s === "cancelled" || s === "canceled")
    return { label: "Cancelado", color: "hsl(var(--hv-coral))" };
  return { label: "Pendente", color: "hsl(var(--hv-amber))" };
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
  const updateMut = useUpdateOrderStatus();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: pedidos.length,
      pending: 0,
      paid: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
    };
    pedidos.forEach((o) => {
      const s = o.status.toLowerCase();
      if (s in c) (c as Record<string, number>)[s] += 1;
    });
    return c;
  }, [pedidos]);

  const filtered = useMemo(() => {
    if (filter === "all") return pedidos;
    return pedidos.filter((o) => o.status.toLowerCase() === filter);
  }, [pedidos, filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Pedidos da loja" sub={`${counts.all} TOTAL`} />
      <Chips
        items={[
          { l: `Todos · ${counts.all}`, on: filter === "all", onClick: () => setFilter("all") },
          { l: `Pendentes · ${counts.pending}`, on: filter === "pending", onClick: () => setFilter("pending") },
          { l: `Pagos · ${counts.paid}`, on: filter === "paid", onClick: () => setFilter("paid") },
          { l: `Em processamento · ${counts.processing}`, on: filter === "processing", onClick: () => setFilter("processing") },
          { l: `Entregues · ${counts.delivered}`, on: filter === "delivered", onClick: () => setFilter("delivered") },
          { l: `Cancelados · ${counts.cancelled}`, on: filter === "cancelled", onClick: () => setFilter("cancelled") },
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
            Nenhum pedido neste filtro.
          </div>
        ) : (
          filtered.map((o, i) => {
            const cl = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const name = o.customer_name || "—";
            const initial = (name[0] || "?").toUpperCase();
            const info = statusInfo(o.status);
            return (
              <div key={o.id} className="hv-card mb-2" style={{ padding: 12 }}>
                <div className="flex gap-3 items-center">
                  <div
                    className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-bold shrink-0"
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
                      {o.product?.name || "Produto"} · {o.size ? `${o.size} · ` : ""}
                      x{o.quantity} · {formatDate(o.created_at)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-[15px] font-bold">
                      {formatBRL(o.amount_cents)}
                    </div>
                    <div className="text-[10px] font-bold mt-0.5" style={{ color: info.color }}>
                      {info.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <label className="text-[11px] text-hv-text-3 shrink-0">Status:</label>
                  <select
                    value={o.status}
                    disabled={updateMut.isPending}
                    onChange={(e) => updateMut.mutate({ id: o.id, status: e.target.value })}
                    className="flex-1 px-2 py-1.5 rounded-[6px] text-[12px] text-hv-text bg-white"
                    style={{ border: "1px solid hsl(var(--hv-line))" }}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
