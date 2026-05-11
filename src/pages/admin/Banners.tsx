// Admin · Banners — CRUD com upload 16:9.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldTextArea, FieldNumber } from "@/components/Field";
import { ImageCropper } from "@/components/ImageCropper";
import { HVIcon } from "@/lib/HVIcon";
import {
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerActive,
  type AdminBanner,
  type BannerInput,
} from "@/hooks/useAdminBanners";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#FF6B4A", "#1B6FB0", "#F2B544", "#2FB37A", "#7B2D9F", "#25C7E5"];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateRange(start: string | null, end: string | null): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `desde ${fmt(start)}`;
  if (end) return `até ${fmt(end)}`;
  return "sem prazo";
}

const EMPTY_FORM: BannerInput = {
  title: "",
  description: null,
  image_url: null,
  link_url: null,
  link_label: null,
  starts_at: null,
  ends_at: null,
  display_order: 0,
};

function toInput(b: AdminBanner): BannerInput {
  return {
    title: b.title,
    description: b.description,
    image_url: b.image_url,
    link_url: b.link_url,
    link_label: b.link_label,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    display_order: b.display_order ?? 0,
  };
}

export default function AdminBanners() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data, isLoading } = useAdminBanners(tenantId);
  const createMut = useCreateBanner(tenantId);
  const updateMut = useUpdateBanner();
  const deleteMut = useDeleteBanner();
  const toggleMut = useToggleBannerActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [form, setForm] = useState<BannerInput>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [confirmDel, setConfirmDel] = useState<AdminBanner | null>(null);

  const banners = data?.banners ?? [];

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, display_order: banners.length });
    setImageFile(null);
    setDialogOpen(true);
  };

  const onEdit = (b: AdminBanner) => {
    setEditing(b);
    setForm(toInput(b));
    setImageFile(null);
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.title.trim()) return;
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          tenantId,
          input: form,
          imageFile,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(
        {
          input: form,
          imageFile,
          createdBy: profile?.id ?? null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Banners"
        sub="GERENCIAR BANNERS"
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

      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : banners.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum banner cadastrado.
          </div>
        ) : (
          banners.map((b, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div
                key={b.id}
                className="hv-card mb-2.5 overflow-hidden p-0"
                style={{ opacity: b.active ? 1 : 0.55 }}
              >
                {/* Imagem ou gradiente placeholder */}
                {b.image_url ? (
                  <img
                    src={b.image_url}
                    alt=""
                    className="w-full h-[80px] object-cover"
                  />
                ) : (
                  <div
                    className="h-[70px]"
                    style={{ background: `linear-gradient(135deg, ${c}, #061826)` }}
                  >
                    <svg
                      viewBox="0 0 360 70"
                      className="w-full h-full opacity-50"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 50 Q90 30 180 50 T360 50 L360 70 L0 70Z" fill="white" />
                    </svg>
                  </div>
                )}

                <div className="p-3 flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold truncate">{b.title}</div>
                    <div
                      className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {dateRange(b.starts_at, b.ends_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMut.mutate({ id: b.id, active: !b.active })}
                    disabled={toggleMut.isPending}
                    className="w-[38px] h-[22px] rounded-[11px] p-0.5 shrink-0 border-0"
                    style={{
                      background: b.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-[9px] bg-white"
                      style={{
                        transform: b.active ? "translateX(16px)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                <div className="flex gap-1.5 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => onEdit(b)}
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-semibold text-hv-text"
                    style={{
                      background: "hsl(var(--hv-bg))",
                      border: "1px solid hsl(var(--hv-line))",
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(b)}
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                    style={{ background: "hsl(var(--hv-coral))" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog criar/editar */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar banner" : "Novo banner"}
        subtitle="DADOS + IMAGEM"
        maxWidth={560}
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
              disabled={isPending || !form.title.trim()}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.title.trim() ? 0.5 : 1,
              }}
            >
              {isPending ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <ImageCropper
          aspectRatio={16 / 9}
          maxWidth={1200}
          onCropped={setImageFile}
          label="Imagem (16:9)"
          previewUrl={editing?.image_url ?? null}
        />
        <FieldText
          label="Título"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
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
            label="URL do link"
            value={form.link_url ?? ""}
            onChange={(v) => setForm({ ...form, link_url: v || null })}
            placeholder="https://..."
          />
          <FieldText
            label="Rótulo do botão"
            value={form.link_label ?? ""}
            onChange={(v) => setForm({ ...form, link_label: v || null })}
            placeholder="Saiba mais"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Início"
            value={toDateInput(form.starts_at)}
            onChange={(v) => setForm({ ...form, starts_at: v || null })}
            placeholder="AAAA-MM-DD"
          />
          <FieldText
            label="Fim"
            value={toDateInput(form.ends_at)}
            onChange={(v) => setForm({ ...form, ends_at: v || null })}
            placeholder="AAAA-MM-DD"
          />
        </div>
        <FieldNumber
          label="Ordem de exibição"
          value={form.display_order}
          onChange={(v) => setForm({ ...form, display_order: v ?? 0 })}
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
        title="Excluir banner?"
        message={`O banner "${confirmDel?.title}" será removido permanentemente.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
