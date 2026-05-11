// Admin · Avisos — CRUD anúncios/avisos com prioridade + push opcional.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldTextArea, FieldSelect, FieldToggle } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useToggleAnnouncementActive,
  useSendAnnouncementPush,
  PRIORITY_OPTIONS,
  type Announcement,
  type AnnouncementInput,
  type AnnouncementPriority,
} from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  low: "hsl(var(--hv-text-3))",
  normal: "hsl(var(--hv-leaf))",
  high: "hsl(var(--hv-amber))",
  urgent: "hsl(var(--hv-coral))",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "BAIXA",
  normal: "NORMAL",
  high: "ALTA",
  urgent: "URGENTE",
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

const EMPTY_FORM: AnnouncementInput = {
  title: "",
  content: "",
  priority: "normal",
  starts_at: null,
  ends_at: null,
};

function toInput(a: Announcement): AnnouncementInput {
  return {
    title: a.title,
    content: a.content,
    priority: a.priority ?? "normal",
    starts_at: a.starts_at,
    ends_at: a.ends_at,
  };
}

export default function AdminAvisos() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: announcements = [], isLoading } = useAnnouncements(tenantId);
  const createMut = useCreateAnnouncement(tenantId);
  const updateMut = useUpdateAnnouncement();
  const deleteMut = useDeleteAnnouncement();
  const toggleMut = useToggleAnnouncementActive();
  const pushMut = useSendAnnouncementPush();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementInput>(EMPTY_FORM);
  const [sendPush, setSendPush] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Announcement | null>(null);

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setSendPush(false);
    setDialogOpen(true);
  };

  const onEdit = (a: Announcement) => {
    setEditing(a);
    setForm(toInput(a));
    setSendPush(false);
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;

    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: form },
        {
          onSuccess: () => {
            if (sendPush && tenantId) {
              pushMut.mutate({
                tenantId,
                announcementId: editing.id,
                title: form.title,
                body: form.content,
              });
            }
            setDialogOpen(false);
          },
        },
      );
    } else {
      createMut.mutate(
        { input: form, createdBy: profile?.id ?? null },
        {
          onSuccess: (created) => {
            if (sendPush && tenantId && created?.id) {
              pushMut.mutate({
                tenantId,
                announcementId: created.id,
                title: form.title,
                body: form.content,
              });
            }
            setDialogOpen(false);
          },
        },
      );
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const isValid = form.title.trim().length > 0 && form.content.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Avisos"
        sub="COMUNICAÇÃO DIRETA"
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
        ) : announcements.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum aviso cadastrado.
          </div>
        ) : (
          announcements.map((a) => {
            const pColor = PRIORITY_COLORS[a.priority ?? "normal"] ?? PRIORITY_COLORS.normal;
            const pLabel = PRIORITY_LABELS[a.priority ?? "normal"] ?? "NORMAL";
            return (
              <div
                key={a.id}
                className="hv-card mb-2.5"
                style={{ padding: 12, opacity: a.active ? 1 : 0.55 }}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[13px] font-bold truncate">{a.title}</div>
                      <span
                        className="hv-chip text-[9px] font-extrabold px-1.5 py-[2px] rounded-[4px] text-white shrink-0"
                        style={{ background: pColor, letterSpacing: "0.08em" }}
                      >
                        {pLabel}
                      </span>
                    </div>
                    <div
                      className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {timeAgo(a.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMut.mutate({ id: a.id, active: !a.active })}
                    disabled={toggleMut.isPending}
                    className="w-[38px] h-[22px] rounded-[11px] p-0.5 shrink-0 border-0"
                    style={{
                      background: a.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-[9px] bg-white"
                      style={{
                        transform: a.active ? "translateX(16px)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {a.content && (
                  <p
                    className="text-[12px] text-hv-text-2 mb-2 line-clamp-2"
                    style={{ lineHeight: 1.5 }}
                  >
                    {a.content}
                  </p>
                )}

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(a)}
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
                    onClick={() =>
                      tenantId &&
                      pushMut.mutate({
                        tenantId,
                        announcementId: a.id,
                        title: a.title,
                        body: a.content,
                      })
                    }
                    disabled={pushMut.isPending}
                    className="px-3 py-2 rounded-[8px] text-[11px] font-semibold border-0"
                    style={{
                      background: "hsl(var(--hv-foam))",
                      color: "hsl(var(--hv-navy))",
                    }}
                  >
                    Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(a)}
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
        title={editing ? "Editar aviso" : "Novo aviso"}
        subtitle="COMUNICAÇÃO + PUSH"
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
              disabled={isPending || !isValid}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !isValid ? 0.5 : 1,
              }}
            >
              {isPending ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <FieldText
          label="Título"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <FieldTextArea
          label="Conteúdo"
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          rows={3}
          placeholder="Texto do aviso..."
        />
        <FieldSelect<AnnouncementPriority>
          label="Prioridade"
          value={form.priority}
          options={PRIORITY_OPTIONS}
          onChange={(v) => v && setForm({ ...form, priority: v })}
        />
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
        <FieldToggle
          label="Enviar push agora"
          description="Dispara notificação push para todos os alunos com push ativo"
          checked={sendPush}
          onChange={setSendPush}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir aviso?"
        message={`O aviso "${confirmDel?.title}" será removido permanentemente.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
