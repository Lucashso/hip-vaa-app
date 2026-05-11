// Meus pedidos — lista pedidos da loja + status traduzido + modal PIX pra pendentes.

import { useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useMyStudent } from "@/hooks/useStudent";
import { useMyOrders, type ProductOrder } from "@/hooks/useMyOrders";
import { cn, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface StatusInfo {
  label: string;
  color: string;
}

function statusInfo(status: string): StatusInfo {
  switch ((status || "").toLowerCase()) {
    case "delivered":
    case "entregue":
      return { label: "Entregue", color: "hsl(var(--hv-leaf))" };
    case "shipped":
    case "enviado":
      return { label: "Enviado", color: "hsl(var(--hv-blue))" };
    case "processing":
    case "preparing":
    case "separation":
    case "separating":
      return { label: "Em separação", color: "hsl(var(--hv-amber))" };
    case "paid":
      return { label: "Pago", color: "hsl(var(--hv-leaf))" };
    case "pending":
      return { label: "Aguardando pagamento", color: "hsl(var(--hv-amber))" };
    case "cancelled":
    case "canceled":
      return { label: "Cancelado", color: "hsl(var(--hv-text-3))" };
    default:
      return { label: status || "Pendente", color: "hsl(var(--hv-text-2))" };
  }
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
}

function shortId(id: string): string {
  return `#${id.slice(0, 4).toUpperCase()}`;
}

interface Group {
  order: ProductOrder;
  total: number;
  items: ProductOrder[];
}

export default function StudentMeusPedidos() {
  const { data: student } = useMyStudent();
  const { data: orders = [], isLoading } = useMyOrders(student?.id);
  const [pixOrder, setPixOrder] = useState<ProductOrder | null>(null);
  const [copied, setCopied] = useState(false);

  const groups = useMemo<Group[]>(() => {
    const buckets = new Map<string, ProductOrder[]>();
    for (const o of orders) {
      const key = `${o.created_at.slice(0, 16)}-${o.status}`;
      const arr = buckets.get(key) ?? [];
      arr.push(o);
      buckets.set(key, arr);
    }
    return Array.from(buckets.values()).map((items) => ({
      order: items[0],
      total: items.reduce((s, i) => s + (i.amount_cents || 0) * (i.quantity || 1), 0),
      items,
    }));
  }, [orders]);

  const handleCopy = async () => {
    const code = pixOrder?.invoice?.pix_qr;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <PageScaffold
      eyebrow={`LOJA HIP VA'A · ${groups.length} PEDIDO${groups.length === 1 ? "" : "S"}`}
      title="Meus pedidos"
    >
      {isLoading ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Carregando pedidos…
        </div>
      ) : groups.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="shop" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">
            Sem pedidos por enquanto
          </div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[260px] mx-auto">
            Quando você comprar algo da loja, ele aparece aqui.
          </div>
        </div>
      ) : (
        groups.map((g, i) => {
          const info = statusInfo(g.order.status);
          const delivered =
            info.label === "Entregue" || g.order.status === "delivered";
          const isPending = (g.order.status || "").toLowerCase() === "pending";
          const hasPix = !!g.order.invoice?.pix_qr;
          return (
            <div key={g.order.id} className="hv-card p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider font-bold">
                    PEDIDO {shortId(g.order.id)} · {shortDate(g.order.created_at)}
                  </div>
                  <div
                    className="text-[13px] font-bold mt-1"
                    style={{ color: info.color }}
                  >
                    {info.label}
                  </div>
                </div>
                <div className="font-display text-[18px] font-extrabold">
                  {formatBRL(g.total)}
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-hv-line">
                {g.items.map((item, j) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    {item.product?.photo_url ? (
                      <img
                        src={item.product.photo_url}
                        alt={item.product.name}
                        className="w-[30px] h-[30px] rounded-[8px] object-cover"
                      />
                    ) : (
                      <div
                        className="w-[30px] h-[30px] rounded-[8px]"
                        style={{
                          background: `hsl(${(i + j) * 50}, 50%, 75%)`,
                        }}
                      />
                    )}
                    <div className="flex-1 text-[12px] min-w-0">
                      <div className="font-semibold truncate">
                        {item.product?.name || "Produto"}
                      </div>
                      <div className="text-hv-text-3 font-mono text-[10px]">
                        {item.size ? `${item.size} · ` : ""}
                        {formatBRL(item.amount_cents || 0)}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold font-mono">
                      ×{item.quantity || 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2.5">
                {isPending && hasPix && (
                  <button
                    type="button"
                    onClick={() => setPixOrder(g.order)}
                    className="flex-1 px-3 py-2.5 rounded-[10px] bg-hv-cyan text-hv-ink border-none font-bold text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <HVIcon name="qr" size={14} stroke={2.2} />
                    Pagar com PIX
                  </button>
                )}
                <button
                  type="button"
                  className={cn(
                    "flex-1 px-3 py-2.5 rounded-[10px] bg-hv-bg border border-hv-line font-semibold text-[12px] text-foreground",
                  )}
                >
                  Detalhes
                </button>
                {delivered && (
                  <button
                    type="button"
                    className="flex-1 px-3 py-2.5 rounded-[10px] bg-hv-navy text-white border-none font-semibold text-[12px]"
                  >
                    Recomprar
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {pixOrder?.invoice && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end">
          <div className="bg-background rounded-t-[24px] w-full max-w-md mx-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-[18px]">
                Pagamento PIX
              </div>
              <button
                type="button"
                onClick={() => setPixOrder(null)}
                className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
              >
                <HVIcon name="x" size={18} />
              </button>
            </div>
            <div className="text-center space-y-3">
              <div className="font-display text-[24px] font-extrabold text-hv-navy">
                {formatBRL((pixOrder.amount_cents || 0) * (pixOrder.quantity || 1))}
              </div>
              <div className="mx-auto w-[220px] h-[220px] bg-white rounded-[16px] grid place-items-center overflow-hidden border border-hv-line">
                {pixOrder.invoice.pix_qr_base64 ? (
                  <img
                    src={`data:image/png;base64,${pixOrder.invoice.pix_qr_base64}`}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-hv-text-3 px-3 text-center">
                    QR não disponível. Use o código abaixo.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full h-11 rounded-[12px] border border-hv-line bg-hv-surface font-semibold text-sm flex items-center justify-center gap-2"
              >
                <HVIcon name={copied ? "check" : "copy"} size={16} />
                {copied ? "Copiado!" : "Copiar código PIX"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
