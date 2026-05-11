// Admin · Produtos — grid 2-col com tag estoque + CRUD + upload foto.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldTextArea, FieldNumber } from "@/components/Field";
import { ImageCropper } from "@/components/ImageCropper";
import { HVIcon } from "@/lib/HVIcon";
import {
  useAdminProdutos,
  useCreateProduto,
  useUpdateProduto,
  useDeleteProduto,
  useToggleProdutoActive,
  type AdminProduto,
  type ProdutoInput,
} from "@/hooks/useAdminProdutos";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

const COLORS = ["#25C7E5", "#0E3A5F", "#2FB37A", "#7B2D9F", "#FF6B4A", "#F2B544"];

function stockStatus(stock: number | null): "ok" | "low" | "out" {
  if (stock == null) return "ok";
  if (stock <= 0) return "out";
  if (stock <= 5) return "low";
  return "ok";
}

const EMPTY_FORM: ProdutoInput = {
  name: "",
  description: null,
  type: "outros",
  price_cents: 0,
  stock_quantity: null,
  photo_url: null,
};

function toInput(p: AdminProduto): ProdutoInput {
  return {
    name: p.name,
    description: p.description,
    type: p.type ?? "outros",
    price_cents: p.price_cents,
    stock_quantity: p.stock_quantity,
    photo_url: p.photo_url,
  };
}

/** Converte string "99,90" ou "99.90" para centavos */
function parseBRLInput(v: string): number {
  const clean = v.replace(/[^\d,.]/, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export default function AdminProdutos() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: produtos = [], isLoading } = useAdminProdutos(tenantId);
  const createMut = useCreateProduto(tenantId);
  const updateMut = useUpdateProduto();
  const deleteMut = useDeleteProduto();
  const toggleMut = useToggleProdutoActive();

  const [cat, setCat] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduto | null>(null);
  const [form, setForm] = useState<ProdutoInput>(EMPTY_FORM);
  const [priceStr, setPriceStr] = useState("0,00");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [confirmDel, setConfirmDel] = useState<AdminProduto | null>(null);

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

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPriceStr("0,00");
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const onEdit = (p: AdminProduto) => {
    setEditing(p);
    const input = toInput(p);
    setForm(input);
    setPriceStr(formatPriceInput(p.price_cents));
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.name.trim()) return;
    const finalForm: ProdutoInput = {
      ...form,
      price_cents: parseBRLInput(priceStr),
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, tenantId, input: finalForm, photoFile },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(
        { input: finalForm, photoFile },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Produtos"
        sub={`LOJA HIP VA'A · ${produtos.length} SKU${produtos.length === 1 ? "" : "s"}`}
        action={
          <button
            type="button"
            onClick={onNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} />
            Novo
          </button>
        }
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
                <div key={pr.id} className="hv-card p-2" style={{ opacity: pr.active ? 1 : 0.55 }}>
                  <div
                    className="h-[90px] rounded-[10px] relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}DD)` }}
                  >
                    {pr.photo_url ? (
                      <img
                        src={pr.photo_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 100 90"
                        className="absolute inset-0 w-full h-full opacity-40"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 60 Q25 50 50 60 T100 60 L100 90 L0 90Z" fill="white" />
                      </svg>
                    )}
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
                  <div className="flex gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(pr)}
                      className="flex-1 py-1.5 rounded-[6px] text-[10px] font-semibold text-hv-text"
                      style={{
                        background: "hsl(var(--hv-bg))",
                        border: "1px solid hsl(var(--hv-line))",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleMut.mutate({ id: pr.id, active: !pr.active })
                      }
                      className="px-2 py-1.5 rounded-[6px] text-[10px] font-semibold border-0"
                      style={{
                        background: pr.active ? "hsl(var(--hv-line))" : "hsl(var(--hv-leaf))",
                        color: pr.active ? "hsl(var(--hv-text))" : "white",
                      }}
                    >
                      {pr.active ? "Pausar" : "Ativar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog criar/editar */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar produto" : "Novo produto"}
        subtitle="DADOS + FOTO"
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-semibold text-hv-text"
              style={{
                background: "hsl(var(--hv-bg))",
                border: "1px solid hsl(var(--hv-line))",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending || !form.name.trim()}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.name.trim() ? 0.5 : 1,
              }}
            >
              {isPending ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <ImageCropper
          aspectRatio={1}
          maxWidth={600}
          onCropped={setPhotoFile}
          label="Foto do produto (1:1)"
          previewUrl={editing?.photo_url ?? null}
        />
        <FieldText
          label="Nome"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FieldTextArea
          label="Descrição"
          value={form.description ?? ""}
          onChange={(v) => setForm({ ...form, description: v || null })}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Categoria"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            placeholder="camiseta, acessório..."
          />
          <FieldText
            label="Preço (R$)"
            value={priceStr}
            onChange={(v) => setPriceStr(v)}
            placeholder="0,00"
          />
        </div>
        <FieldNumber
          label="Estoque (deixar em branco = ilimitado)"
          value={form.stock_quantity}
          onChange={(v) => setForm({ ...form, stock_quantity: v })}
          min={0}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir produto?"
        message={`O produto "${confirmDel?.name}" será removido permanentemente.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
