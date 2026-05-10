// Loja — banner crédito + chips categoria + grid placeholder de produtos.

import { useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyCredits } from "@/hooks/useStudent";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn, formatBRL } from "@/lib/utils";

interface Category {
  id: string;
  label: string;
}

interface Product {
  id: string;
  name: string;
  caption: string;
  price_cents: number;
  icon: HVIconName;
  gradient: string;
  category: string;
}

const CATEGORIES: Category[] = [
  { id: "all", label: "Tudo" },
  { id: "apparel", label: "Vestuário" },
  { id: "gear", label: "Equipamento" },
  { id: "tour", label: "Passeios" },
  { id: "training", label: "Treino" },
];

const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Camiseta Aloha",
    caption: "Dry-fit · azul oceano",
    price_cents: 12900,
    icon: "wave",
    gradient: "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-blue)) 100%)",
    category: "apparel",
  },
  {
    id: "p2",
    name: "Remo carbono",
    caption: "Ajustável 180–210cm",
    price_cents: 89000,
    icon: "paddle",
    gradient: "linear-gradient(155deg, hsl(var(--hv-navy)) 0%, hsl(var(--hv-cyan)) 100%)",
    category: "gear",
  },
  {
    id: "p3",
    name: "Pass Travessia",
    caption: "Acesso a 1 passeio livre",
    price_cents: 18000,
    icon: "boat",
    gradient: "linear-gradient(155deg, hsl(var(--hv-coral)) 0%, hsl(var(--hv-amber)) 100%)",
    category: "tour",
  },
  {
    id: "p4",
    name: "Pacote Force",
    caption: "5 aulas de treino seco",
    price_cents: 24000,
    icon: "dumbbell",
    gradient: "linear-gradient(155deg, hsl(var(--hv-ink-2)) 0%, hsl(var(--hv-navy)) 100%)",
    category: "training",
  },
];

export default function StudentLoja() {
  const { data: student } = useMyStudent();
  const { data: credits } = useMyCredits(student?.id);
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const filtered =
    selectedCat === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCat);

  return (
    <PageScaffold eyebrow="HIP VA'A STORE" title="Loja">
      {/* Crédito banner */}
      <div className="hv-card bg-hv-foam p-4 flex items-center gap-3 border-hv-foam">
        <div className="w-11 h-11 rounded-[12px] bg-hv-navy text-white grid place-items-center">
          <HVIcon name="gift" size={20} stroke={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="hv-eyebrow text-hv-navy/70">SEUS CRÉDITOS</div>
          <div className="font-display text-[20px] text-hv-navy leading-tight">
            {formatBRL(credits?.available_cents || 0)} disponível
          </div>
        </div>
        <button
          type="button"
          className="text-[11px] font-bold text-hv-blue uppercase tracking-wider"
        >
          Como usar
        </button>
      </div>

      {/* Chips categoria */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCat(cat.id)}
            className={cn(
              "px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors",
              selectedCat === cat.id
                ? "bg-hv-navy text-white"
                : "bg-hv-surface border border-hv-line text-hv-text-2",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid produtos */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className="hv-card overflow-hidden text-left active:scale-[0.97] transition-transform"
          >
            <div
              className="relative h-32 grid place-items-center text-white"
              style={{ background: p.gradient }}
            >
              <HVIcon name={p.icon} size={48} color="rgba(255,255,255,0.85)" stroke={1.4} />
              <div className="absolute top-2 right-2 hv-chip bg-white/80 text-hv-ink">
                NOVO
              </div>
            </div>
            <div className="p-3">
              <div className="font-display text-[14px] leading-tight">{p.name}</div>
              <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                {p.caption}
              </div>
              <div className="font-mono font-bold text-[14px] text-hv-navy mt-2">
                {formatBRL(p.price_cents)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Nada nessa categoria por enquanto.
        </div>
      )}
    </PageScaffold>
  );
}
