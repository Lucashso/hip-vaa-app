// Loja — produtos ativos do tenant, modal de tamanho/quantidade, PIX inline.

import { useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyCredits } from "@/hooks/useStudent";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveProducts,
  useCreateProductOrder,
  getAvailableSizes,
  type Product,
} from "@/hooks/useProducts";
import { HVIcon } from "@/lib/HVIcon";
import { cn, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  label: string;
}

const CATEGORIES: Category[] = [
  { id: "all", label: "Tudo" },
  { id: "apparel", label: "Vestuário" },
  { id: "gear", label: "Equipamento" },
  { id: "tour", label: "Passeios" },
  { id: "training", label: "Treino" },
];

interface PixData {
  pix_qr: string;
  pix_qr_base64?: string;
  order_id: string;
  amount_cents: number;
  product_name: string;
}

export default function StudentLoja() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || undefined;
  const { data: student } = useMyStudent();
  const { data: credits } = useMyCredits(student?.id);
  const { data: products = [], isLoading } = useActiveProducts(tenantId);
  const createOrder = useCreateProductOrder();

  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = selectedCat === "all" ? products : products; // categoria visual

  const closeSheet = () => {
    setOpenProduct(null);
    setSelectedSize("");
    setQuantity(1);
  };

  const handleBuy = async () => {
    if (!openProduct) return;
    const sizes = getAvailableSizes(openProduct);
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Selecione um tamanho");
      return;
    }
    try {
      const res = await createOrder.mutateAsync({
        productId: openProduct.id,
        size: selectedSize || null,
        quantity,
      });
      if (res.pix_qr) {
        setPixData({
          pix_qr: res.pix_qr,
          pix_qr_base64: res.pix_qr_base64,
          order_id: res.order_id,
          amount_cents: res.amount_cents,
          product_name: res.product_name,
        });
        closeSheet();
      } else {
        toast.success("Pedido criado! Acompanhe em Meus Pedidos.");
        closeSheet();
      }
    } catch {
      // toast já no hook
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.pix_qr) return;
    try {
      await navigator.clipboard.writeText(pixData.pix_qr);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  // Tela PIX
  if (pixData) {
    return (
      <PageScaffold eyebrow="LOJA" title="Pagamento PIX">
        <div className="hv-card p-5 text-center space-y-4">
          <div className="text-sm text-hv-text-2">{pixData.product_name}</div>
          <div className="font-display text-[28px] font-extrabold text-hv-navy">
            {formatBRL(pixData.amount_cents)}
          </div>
          <div className="mx-auto w-[220px] h-[220px] bg-white rounded-[16px] grid place-items-center overflow-hidden border border-hv-line">
            {pixData.pix_qr_base64 ? (
              <img
                src={`data:image/png;base64,${pixData.pix_qr_base64}`}
                alt="QR Code PIX"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-hv-text-3">Use o código abaixo</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopyPix}
            className="w-full h-11 rounded-[12px] border border-hv-line bg-hv-surface font-semibold text-sm flex items-center justify-center gap-2"
          >
            <HVIcon name={copied ? "check" : "copy"} size={16} />
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
          <button
            type="button"
            onClick={() => setPixData(null)}
            className="w-full h-11 rounded-[12px] bg-hv-navy text-white font-bold text-sm"
          >
            Continuar comprando
          </button>
        </div>
      </PageScaffold>
    );
  }

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
      </div>

      {/* Chips categoria (visual) */}
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
      {isLoading ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Carregando produtos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="shop" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">Loja vazia</div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[260px] mx-auto">
            Nenhum produto disponível no momento.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenProduct(p)}
              className="hv-card overflow-hidden text-left active:scale-[0.97] transition-transform"
            >
              <div className="relative h-32 grid place-items-center overflow-hidden bg-hv-foam">
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HVIcon name="shop" size={42} color="hsl(var(--hv-navy) / 0.55)" />
                )}
              </div>
              <div className="p-3">
                <div className="font-display text-[14px] leading-tight truncate">
                  {p.name}
                </div>
                {p.description && (
                  <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                    {p.description}
                  </div>
                )}
                <div className="font-mono font-bold text-[14px] text-hv-navy mt-2">
                  {formatBRL(p.price_cents)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sheet inline com produto */}
      {openProduct && (
        <ProductSheet
          product={openProduct}
          selectedSize={selectedSize}
          quantity={quantity}
          onSizeChange={(s) => {
            setSelectedSize(s);
            setQuantity(1);
          }}
          onQuantityChange={setQuantity}
          onClose={closeSheet}
          onBuy={handleBuy}
          buying={createOrder.isPending}
        />
      )}
    </PageScaffold>
  );
}

interface ProductSheetProps {
  product: Product;
  selectedSize: string;
  quantity: number;
  onSizeChange: (size: string) => void;
  onQuantityChange: (q: number) => void;
  onClose: () => void;
  onBuy: () => void;
  buying: boolean;
}

function ProductSheet({
  product,
  selectedSize,
  quantity,
  onSizeChange,
  onQuantityChange,
  onClose,
  onBuy,
  buying,
}: ProductSheetProps) {
  const sizes = getAvailableSizes(product);
  const max =
    product.type === "stock" && selectedSize
      ? sizes.find((s) => s.size === selectedSize)?.quantity ?? 99
      : 99;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end">
      <div className="bg-background rounded-t-[24px] w-full max-w-md mx-auto max-h-[88vh] flex flex-col">
        <div className="p-5 flex items-center justify-between border-b border-hv-line">
          <div className="font-display text-[18px] truncate pr-3">{product.name}</div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {product.photo_url ? (
            <img
              src={product.photo_url}
              alt={product.name}
              className="w-full h-44 rounded-[12px] object-cover"
            />
          ) : (
            <div className="w-full h-44 rounded-[12px] bg-hv-foam grid place-items-center">
              <HVIcon name="shop" size={42} color="hsl(var(--hv-navy) / 0.55)" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="font-display text-[24px] font-extrabold text-hv-navy">
              {formatBRL(product.price_cents)}
            </div>
            {product.type === "stock" && (
              <span className="hv-chip bg-hv-foam text-hv-navy">Pronta entrega</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-hv-text-2 leading-[1.5]">{product.description}</p>
          )}

          {sizes.length > 0 && (
            <div>
              <div className="hv-eyebrow mb-2">Tamanho</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ size, quantity: sizeQty, disabled }) => (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSizeChange(size)}
                    className={cn(
                      "min-w-12 px-3.5 py-2 rounded-[10px] border text-sm font-semibold",
                      disabled
                        ? "border-hv-line text-hv-text-3 line-through bg-hv-bg cursor-not-allowed"
                        : selectedSize === size
                          ? "border-hv-navy bg-hv-navy text-white"
                          : "border-hv-line bg-hv-surface text-foreground",
                    )}
                  >
                    {size}
                    {sizeQty !== null && !disabled && (
                      <span className="block text-[9px] font-normal opacity-80">
                        {sizeQty} un.
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="hv-eyebrow mb-2">Quantidade</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-[10px] border border-hv-line bg-hv-surface font-bold text-lg disabled:opacity-40"
              >
                −
              </button>
              <span className="w-10 text-center font-display text-[18px] font-bold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                disabled={product.type === "stock" && quantity >= max}
                className="w-10 h-10 rounded-[10px] border border-hv-line bg-hv-surface font-bold text-lg disabled:opacity-40"
              >
                +
              </button>
              {product.type === "stock" && selectedSize && max > 0 && (
                <span className="text-[11px] text-hv-text-3">(máx {max})</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-hv-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-hv-text-2">Total</span>
            <span className="font-display text-[22px] font-extrabold text-hv-navy">
              {formatBRL(product.price_cents * quantity)}
            </span>
          </div>
          <button
            type="button"
            disabled={buying || (sizes.length > 0 && !selectedSize)}
            onClick={onBuy}
            className="w-full h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40"
          >
            {buying ? "Processando…" : "Comprar com PIX"}
            <HVIcon name="arrow-right" size={16} stroke={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
