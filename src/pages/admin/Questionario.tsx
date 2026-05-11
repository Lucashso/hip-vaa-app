// Admin · Questionário de saúde — CRUD health_questionnaire_fields.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldNumber, FieldSelect, FieldTextArea, FieldToggle } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import {
  useHealthFields,
  useCreateHealthField,
  useUpdateHealthField,
  useDeleteHealthField,
  useReorderHealthFields,
  FIELD_TYPES,
  type HealthField,
  type HealthFieldInput,
  type FieldType,
} from "@/hooks/useHealthFields";
import { useAuth } from "@/hooks/useAuth";

const EMPTY: HealthFieldInput = {
  label: "",
  section: "Geral",
  icon_name: "Activity",
  field_type: "boolean",
  select_options: null,
  unit: null,
  min_value: null,
  max_value: null,
  is_critical: false,
  has_details: true,
  sort_order: 0,
};

function toInput(f: HealthField): HealthFieldInput {
  return {
    label: f.label,
    section: f.section,
    icon_name: f.icon_name || "Activity",
    field_type: (f.field_type || "boolean") as FieldType,
    select_options: f.select_options ?? null,
    unit: f.unit,
    min_value: f.min_value,
    max_value: f.max_value,
    is_critical: f.is_critical,
    has_details: f.has_details,
    sort_order: f.sort_order ?? 0,
  };
}

function typeLabel(t: string | null): string {
  switch ((t || "").toLowerCase()) {
    case "boolean": return "sim/não";
    case "text": return "texto";
    case "select": return "múltipla";
    case "number": return "número";
    default: return t || "—";
  }
}

export default function AdminQuestionario() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: fields = [], isLoading } = useHealthFields(tenantId);
  const createMut = useCreateHealthField(tenantId);
  const updateMut = useUpdateHealthField();
  const deleteMut = useDeleteHealthField();
  const reorderMut = useReorderHealthFields();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HealthField | null>(null);
  const [form, setForm] = useState<HealthFieldInput>(EMPTY);
  const [optionsCsv, setOptionsCsv] = useState("");
  const [confirmDel, setConfirmDel] = useState<HealthField | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, HealthField[]>();
    fields.forEach((f) => {
      const k = f.section || "Geral";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(f);
    });
    return Array.from(map.entries());
  }, [fields]);

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: fields.length });
    setOptionsCsv("");
    setDialogOpen(true);
  };
  const onEdit = (f: HealthField) => {
    setEditing(f);
    const inp = toInput(f);
    setForm(inp);
    setOptionsCsv((inp.select_options ?? []).join(", "));
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.label.trim()) return;
    const payload: HealthFieldInput = {
      ...form,
      select_options:
        form.field_type === "select"
          ? optionsCsv
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx === -1) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= fields.length) return;
    const a = fields[idx];
    const b = fields[swap];
    reorderMut.mutate([
      { id: a.id, sort_order: b.sort_order ?? swap },
      { id: b.id, sort_order: a.sort_order ?? idx },
    ]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Questionário de saúde"
        sub={`${fields.length} PERGUNTA${fields.length === 1 ? "" : "S"}`}
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
        ) : fields.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhuma pergunta configurada.
          </div>
        ) : (
          grouped.map(([section, list]) => (
            <div key={section} className="mb-4">
              <h3
                className="text-[12px] uppercase font-bold text-hv-text-2 mb-2"
                style={{ letterSpacing: "0.12em" }}
              >
                {section}
              </h3>
              <div className="hv-card overflow-hidden p-0">
                {list.map((f, i, arr) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2"
                    style={{
                      padding: "10px 12px",
                      borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(f.id, -1)}
                        className="w-6 h-6 rounded-[6px] grid place-items-center border-0 text-hv-text-2"
                        style={{ background: "hsl(var(--hv-bg))" }}
                      >
                        <HVIcon name="chevron-left" size={14} style={{ transform: "rotate(90deg)" }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(f.id, 1)}
                        className="w-6 h-6 rounded-[6px] grid place-items-center border-0 text-hv-text-2"
                        style={{ background: "hsl(var(--hv-bg))" }}
                      >
                        <HVIcon name="chevron-left" size={14} style={{ transform: "rotate(-90deg)" }} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{f.label}</div>
                      <div
                        className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        {typeLabel(f.field_type)}
                        {f.unit ? ` · ${f.unit}` : ""}
                        {f.is_critical ? " · crítica" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(f)}
                      className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold text-hv-text"
                      style={{
                        background: "hsl(var(--hv-bg))",
                        border: "1px solid hsl(var(--hv-line))",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDel(f)}
                      className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold text-white border-0"
                      style={{ background: "hsl(var(--hv-coral))" }}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar pergunta" : "Nova pergunta"}
        subtitle="QUESTIONÁRIO DE SAÚDE"
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
              disabled={createMut.isPending || updateMut.isPending || !form.label.trim()}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.label.trim() ? 0.5 : 1,
              }}
            >
              {editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <FieldText
          label="Pergunta (label)"
          value={form.label}
          onChange={(v) => setForm({ ...form, label: v })}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Seção"
            value={form.section}
            onChange={(v) => setForm({ ...form, section: v })}
          />
          <FieldText
            label="Ícone (lucide)"
            value={form.icon_name ?? ""}
            onChange={(v) => setForm({ ...form, icon_name: v })}
            placeholder="Activity"
          />
        </div>
        <FieldSelect
          label="Tipo de campo"
          value={form.field_type}
          options={[...FIELD_TYPES]}
          onChange={(v) => v && setForm({ ...form, field_type: v as FieldType })}
        />
        {form.field_type === "select" && (
          <FieldTextArea
            label="Opções (separadas por vírgula)"
            value={optionsCsv}
            onChange={setOptionsCsv}
            placeholder="Opção 1, Opção 2, Opção 3"
            rows={2}
          />
        )}
        {form.field_type === "number" && (
          <>
            <FieldText
              label="Unidade"
              value={form.unit ?? ""}
              onChange={(v) => setForm({ ...form, unit: v || null })}
              placeholder="kg, cm, bpm..."
            />
            <div className="grid grid-cols-2 gap-2">
              <FieldNumber
                label="Mínimo"
                value={form.min_value}
                onChange={(v) => setForm({ ...form, min_value: v })}
              />
              <FieldNumber
                label="Máximo"
                value={form.max_value}
                onChange={(v) => setForm({ ...form, max_value: v })}
              />
            </div>
          </>
        )}
        <FieldToggle
          label="Crítica"
          description="Bloqueia check-in até resolver"
          checked={form.is_critical}
          onChange={(v) => setForm({ ...form, is_critical: v })}
        />
        <FieldToggle
          label="Mostrar campo de detalhes"
          description="Permite descrever a resposta"
          checked={form.has_details}
          onChange={(v) => setForm({ ...form, has_details: v })}
        />
        <FieldNumber
          label="Ordem"
          value={form.sort_order}
          onChange={(v) => setForm({ ...form, sort_order: v ?? 0 })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir pergunta?"
        message={`"${confirmDel?.label}" será removida.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
