// Admin · Parceiros — CRUD parceiros + ações (whatsapp/link/coupon).

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldNumber, FieldTextArea, FieldSelect, FieldToggle } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import {
  usePartnersAdmin,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  useTogglePartnerActive,
  usePartnerActionsAdmin,
  useSavePartnerActions,
  PARTNER_ACTION_TYPES,
  type PartnerAdmin,
  type PartnerInput,
  type PartnerActionInput,
  type PartnerActionType,
} from "@/hooks/usePartnersAdmin";

const COLORS = ["#7B2D9F", "#1B6FB0", "#7A4A1F", "#2FB37A", "#FF6B4A", "#F2B544"];

const EMPTY_PARTNER: PartnerInput = {
  name: "",
  description: "",
  logo_url: "",
  display_order: 0,
};

const EMPTY_ACTION: PartnerActionInput = {
  label: "",
  action_type: "link",
  value: "",
  is_primary: false,
  display_order: 0,
  whatsapp_message: null,
};

function toInput(p: PartnerAdmin): PartnerInput {
  return {
    name: p.name,
    description: p.description ?? "",
    logo_url: p.logo_url ?? "",
    display_order: p.display_order ?? 0,
  };
}

export default function AdminParceiros() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: partners = [], isLoading } = usePartnersAdmin(tenantId);
  const createMut = useCreatePartner(tenantId);
  const updateMut = useUpdatePartner();
  const deleteMut = useDeletePartner();
  const toggleMut = useTogglePartnerActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerAdmin | null>(null);
  const [form, setForm] = useState<PartnerInput>(EMPTY_PARTNER);
  const [actions, setActions] = useState<PartnerActionInput[]>([]);
  const [confirmDel, setConfirmDel] = useState<PartnerAdmin | null>(null);

  const { data: existingActions = [] } = usePartnerActionsAdmin(editing?.id ?? null);
  const saveActionsMut = useSavePartnerActions();

  // Quando carrega actions do partner em edição, popular state
  useEffect(() => {
    if (editing && existingActions.length > 0) {
      setActions(
        existingActions.map((a) => ({
          label: a.label,
          action_type: a.action_type,
          value: a.value,
          is_primary: !!a.is_primary,
          display_order: a.display_order ?? 0,
          whatsapp_message: a.whatsapp_message,
        })),
      );
    } else if (editing && existingActions.length === 0) {
      setActions([]);
    }
  }, [editing, existingActions]);

  const active = partners.filter((p) => p.active).length;
  const inactive = partners.length - active;

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_PARTNER, display_order: partners.length });
    setActions([]);
    setDialogOpen(true);
  };
  const onEdit = (p: PartnerAdmin) => {
    setEditing(p);
    setForm(toInput(p));
    setActions([]);
    setDialogOpen(true);
  };

  const onSubmit = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await new Promise<void>((resolve, reject) => {
        updateMut.mutate(
          { id: editing.id, input: form },
          { onSuccess: () => resolve(), onError: (e) => reject(e) },
        );
      });
      await new Promise<void>((resolve, reject) => {
        saveActionsMut.mutate(
          { partnerId: editing.id, actions },
          { onSuccess: () => resolve(), onError: (e) => reject(e) },
        );
      });
      setDialogOpen(false);
    } else {
      createMut.mutate(form, {
        onSuccess: (created) => {
          const newId = (created as { id: string } | undefined)?.id;
          if (newId && actions.length > 0) {
            saveActionsMut.mutate(
              { partnerId: newId, actions },
              { onSuccess: () => setDialogOpen(false) },
            );
          } else {
            setDialogOpen(false);
          }
        },
      });
    }
  };

  const addAction = () => {
    setActions([...actions, { ...EMPTY_ACTION, display_order: actions.length }]);
  };
  const updAction = (i: number, patch: Partial<PartnerActionInput>) => {
    setActions(actions.map((a, j) => (i === j ? { ...a, ...patch } : a)));
  };
  const delAction = (i: number) => {
    setActions(actions.filter((_, j) => i !== j));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Parceiros"
        sub={`${active} ATIVO${active === 1 ? "" : "S"}${
          inactive ? ` · ${inactive} INATIVO${inactive === 1 ? "" : "S"}` : ""
        }`}
        action={
          <button
            type="button"
            onClick={onNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} /> Novo
          </button>
        }
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : partners.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum parceiro cadastrado.
          </div>
        ) : (
          partners.map((p, i) => {
            const c = COLORS[i % COLORS.length];
            const initial = (p.name?.[0] || "?").toUpperCase();
            return (
              <div
                key={p.id}
                className="hv-card mb-2"
                style={{ padding: 12, opacity: p.active ? 1 : 0.55 }}
              >
                <div className="flex gap-3 items-center">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt=""
                      className="w-11 h-11 rounded-[12px] object-cover"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-[12px] grid place-items-center text-white font-extrabold"
                      style={{ background: c, fontFamily: "var(--hv-font-display)" }}
                    >
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{p.name}</div>
                    {p.description && (
                      <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                        {p.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMut.mutate({ id: p.id, active: !p.active })}
                    className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
                    style={{
                      background: p.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-[10px] bg-white"
                      style={{
                        transform: p.active ? "translateX(18px)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
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
                    onClick={() => setConfirmDel(p)}
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

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar parceiro" : "Novo parceiro"}
        subtitle="DADOS + AÇÕES"
        maxWidth={560}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
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
              disabled={
                createMut.isPending ||
                updateMut.isPending ||
                saveActionsMut.isPending ||
                !form.name.trim()
              }
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.name.trim() ? 0.5 : 1,
              }}
            >
              {editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <FieldText
          label="Nome"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FieldTextArea
          label="Descrição"
          value={form.description ?? ""}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <FieldText
          label="URL do logo"
          value={form.logo_url ?? ""}
          onChange={(v) => setForm({ ...form, logo_url: v })}
          placeholder="https://..."
        />
        <FieldNumber
          label="Ordem"
          value={form.display_order}
          onChange={(v) => setForm({ ...form, display_order: v ?? 0 })}
        />

        <div
          className="mt-4 mb-2 pt-3"
          style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className="hv-mono text-[10px] font-bold text-hv-text-2"
              style={{ letterSpacing: "0.12em" }}
            >
              AÇÕES DO PARCEIRO
            </div>
            <button
              type="button"
              onClick={addAction}
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold flex gap-1 items-center border-0"
              style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
            >
              <HVIcon name="plus" size={12} stroke={2.6} /> Ação
            </button>
          </div>
          {actions.length === 0 ? (
            <div className="text-[11px] text-hv-text-3 py-2">
              Nenhuma ação. Adicione WhatsApp, link ou cupom.
            </div>
          ) : (
            actions.map((a, i) => (
              <div
                key={i}
                className="rounded-[10px] p-2.5 mb-2"
                style={{
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <FieldText
                    label="Rótulo"
                    value={a.label}
                    onChange={(v) => updAction(i, { label: v })}
                  />
                  <FieldSelect
                    label="Tipo"
                    value={a.action_type}
                    options={[...PARTNER_ACTION_TYPES]}
                    onChange={(v) =>
                      v && updAction(i, { action_type: v as PartnerActionType })
                    }
                  />
                </div>
                <FieldText
                  label={
                    a.action_type === "whatsapp"
                      ? "Telefone (DDD+número)"
                      : a.action_type === "link"
                      ? "URL"
                      : "Código do cupom"
                  }
                  value={a.value}
                  onChange={(v) => updAction(i, { value: v })}
                />
                {a.action_type === "whatsapp" && (
                  <FieldTextArea
                    label="Mensagem WhatsApp (opcional)"
                    value={a.whatsapp_message ?? ""}
                    onChange={(v) => updAction(i, { whatsapp_message: v || null })}
                    rows={2}
                  />
                )}
                <div className="flex gap-2 items-center">
                  <FieldToggle
                    label="Primária"
                    checked={a.is_primary}
                    onChange={(v) => updAction(i, { is_primary: v })}
                  />
                  <button
                    type="button"
                    onClick={() => delAction(i)}
                    className="ml-auto px-2.5 py-1 rounded-[6px] text-[10px] font-bold text-white border-0"
                    style={{ background: "hsl(var(--hv-coral))" }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir parceiro?"
        message={`O parceiro "${confirmDel?.name}" e suas ações serão removidos.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
