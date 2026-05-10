// Admin · Produtos — grid 2-col com tag estoque.
// Baseado em admin-mobile.jsx HVAdminProdutos.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminProdutos } from "@/hooks/useAdminProdutos";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

const COLORS = ["#25C7E5", "#0E3A5F", "#2FB37A", "#7B2D9F", "#FF6B4A", "#F2B544"];

function PlusBtn({ label = "Novo" }: { label?: string }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
      style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
    >
      <HVIcon name="plus" size={14} stroke={2.6} />
      {label}
    </button>
  );
}

function stockStatus(stock: number | null): "ok" | "low" | "out" {
  if (stock == null) return "ok";
  if (stock <= 0) return "out";
  if (stock <= 5) return "low";
  return "ok";
}

export default function AdminProdutos() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: produtos = [], isLoading } = useAdminProdutos(tenantId);
  const [cat, setCat] = useState<string>("all");

  const cats = useMemo(() => {
    const counts: Record<string, number> = {};
    produtos.forEach((p) => {
      const t = p.type || "outros";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [produtos]);

  const filtered = useMemo(() => {
    if (cat === "all") return produtos;
    return produtos.filter((p) => (p.type || "outros") === cat);
  }, [produtos, cat]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Produtos"
        sub={`LOJA HIP VA'A · ${produtos.length} SKU${produtos.length === 1 ? "" : "s"}`}
        action={<PlusBtn />}
      />
      <Chips
        items={[
          { l: `Todos · ${produtos.length}`, on: cat === "all", onClick: () => setCat("all") },
          ...Object.entries(cats).map(([k, n]) => ({
            l: `${k} · ${n}`,
            on: cat === k,
            onClick: () => setCat(k),
          })),
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
            Nenhum produto cadastrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((pr, i) => {
              const c = COLORS[i % COLORS.length];
              const s = stockStatus(pr.stock_quantity);
              return (
                <div key={pr.id} className="hv-card p-2">
                  <div
                    className="h-[90px] rounded-[10px] relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}DD)` }}
                  >
                    <svg
                      viewBox="0 0 100 90"
                      className="absolute inset-0 w-full h-full opacity-40"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 60 Q25 50 50 60 T100 60 L100 90 L0 90Z" fill="white" />
                    </svg>
                    <span
                      className="absolute top-1.5 right-1.5 px-1.5 rounded text-[8px] font-extrabold py-[2px]"
                      style={{
                        background:
                          s === "out"
                            ? "hsl(var(--hv-coral))"
                            : s === "low"
                              ? "hsl(var(--hv-amber))"
                              : "rgba(255,255,255,0.85)",
                        color: s === "ok" ? "hsl(var(--hv-navy))" : "white",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s === "out" ? "ESGOTADO" : s === "low" ? "BAIXO" : "OK"}
                    </span>
                  </div>
                  <div
                    className="text-[12px] font-semibold mt-2 leading-tight line-clamp-2"
                    style={{ lineHeight: 1.2 }}
                  >
                    {pr.name}
                  </div>
                  <div className="font-display text-[15px] font-bold mt-1">
                    {formatBRL(pr.price_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
