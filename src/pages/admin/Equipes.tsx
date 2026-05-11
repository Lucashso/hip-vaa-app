// Admin · Equipes / Times — CRUD crew_templates + CrewOrganizer de assentos.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldTextArea, FieldSelect } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import { CrewOrganizer } from "@/components/Crew/CrewOrganizer";
import { useAuth } from "@/hooks/useAuth";
import { useBoats } from "@/hooks/useBoats";
import {
  useCrewTemplates,
  useCreateCrewTemplate,
  useUpdateCrewTemplate,
  useDeleteCrewTemplate,
  type CrewTemplate,
  type CrewTemplateInput,
} from "@/hooks/useCrew";

const COLORS = ["#1B6FB0", "#2FB37A", "#FF6B4A", "#7B2D9F", "#F2B544", "#25C7E5"];

const EMPTY: CrewTemplateInput = {
  name: "",
  description: "",
  boat_id: "",
};

function toInput(t: CrewTemplate): CrewTemplateInput {
  return {
    name: t.name,
    description: t.description ?? "",
    boat_id: t.boat_id,
  };
}

export default function AdminEquipes() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: teams = [], isLoading } = useCrewTemplates(tenantId);
  const { data: boats = [] } = useBoats(tenantId);
  const createMut = useCreateCrewTemplate(tenantId);
  const updateMut = useUpdateCrewTemplate();
  const deleteMut = useDeleteCrewTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrewTemplate | null>(null);
  const [form, setForm] = useState<CrewTemplateInput>(EMPTY);
  const [organizerTeam, setOrganizerTeam] = useState<CrewTemplate | null>(null);
  const [confirmDel, setConfirmDel] = useState<CrewTemplate | null>(null);

  const onNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const onEdit = (t: CrewTemplate) => {
    setEditing(t);
    setForm(toInput(t));
    setDialogOpen(true);
  };
  const onSubmit = () => {
    if (!form.name.trim() || !form.boat_id) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: form },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Equipes / times"
        sub={`${teams.length} TIMES`}
        action={
          <button
            type="button"
            onClick={onNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} /> Nova
          </button>
        }
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : teams.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum time cadastrado.
          </div>
        ) : (
          teams.map((t, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={t.id} className="hv-card mb-2.5" style={{ padding: 14 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold truncate">{t.name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {t.boat?.name ?? "Sem embarcação"}
                      {t.boat?.capacity ? ` · OC${t.boat.capacity}` : ""}
                    </div>
                    {t.description && (
                      <div className="text-[11px] text-hv-text-3 mt-0.5 truncate opacity-70">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <div
                    className="w-[38px] h-[38px] rounded-[12px] grid place-items-center text-white shrink-0"
                    style={{ background: color }}
                  >
                    <HVIcon name="users" size={18} />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => setOrganizerTeam(t)}
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0 flex items-center justify-center gap-1"
                    style={{ background: "hsl(var(--hv-navy))" }}
                  >
                    <HVIcon name="edit" size={12} /> Tripulação
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
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
                    onClick={() => setConfirmDel(t)}
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

      {/* Dialog novo/editar template */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar equipe" : "Nova equipe"}
        subtitle="TRIPULAÇÃO PRÉ-MONTADA"
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
                !form.name.trim() ||
                !form.boat_id
              }
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.name.trim() || !form.boat_id ? 0.5 : 1,
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
        <FieldSelect
          label="Embarcação"
          required
          value={form.boat_id}
          options={boats.map((b) => ({
            value: b.id,
            label: `${b.name} · ${b.type} · ${b.capacity}`,
          }))}
          onChange={(v) => setForm({ ...form, boat_id: v || "" })}
        />
        <FieldTextArea
          label="Descrição"
          value={form.description ?? ""}
          onChange={(v) => setForm({ ...form, description: v })}
        />
      </Modal>

      {/* Modal do CrewOrganizer */}
      <Modal
        open={!!organizerTeam}
        onClose={() => setOrganizerTeam(null)}
        title={organizerTeam ? `Tripulação · ${organizerTeam.name}` : "Tripulação"}
        subtitle="EDITAR ASSENTOS"
        maxWidth={520}
      >
        {organizerTeam && (
          <CrewOrganizer
            template={organizerTeam}
            tenantId={tenantId}
            onSave={() => setOrganizerTeam(null)}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir equipe?"
        message={`"${confirmDel?.name}" e seus assentos serão removidos.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
