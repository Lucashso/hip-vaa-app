// Admin · Aulas — CRUD de turmas + filtros + cancelamentos.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import {
  FieldText,
  FieldNumber,
  FieldSelect,
  FieldToggle,
} from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useVenues } from "@/hooks/useVenues";
import { useBoats } from "@/hooks/useBoats";
import { useTeamMembers } from "@/hooks/useTeam";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useToggleClassActive,
  useCreateCancellation,
  CLASS_LEVELS,
  WEEKDAYS_LABELS,
  type ClassRow,
  type ClassInput,
  type ClassLevel,
} from "@/hooks/useClasses";

const EMPTY: ClassInput = {
  name: "",
  weekday: 1,
  start_time: "06:00",
  end_time: "07:30",
  venue_id: "",
  boat_id: null,
  max_capacity: 12,
  level: "iniciante",
  level_required: null,
  instructor_id: null,
  active: true,
};

function classToInput(c: ClassRow): ClassInput {
  return {
    name: c.name,
    weekday: c.weekday,
    start_time: c.start_time.slice(0, 5),
    end_time: c.end_time.slice(0, 5),
    venue_id: c.venue_id,
    boat_id: c.boat_id,
    max_capacity: c.max_capacity,
    level: c.level ?? "iniciante",
    level_required: c.level_required,
    instructor_id: c.coach_user_id,
    active: c.active,
  };
}

export default function AdminAulas() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;

  const [filterWeekday, setFilterWeekday] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<ClassLevel | null>(null);

  const { data: classes = [], isLoading } = useClasses(tenantId, {
    weekday: filterWeekday,
    level: filterLevel,
  });
  const { data: venues = [] } = useVenues(tenantId);
  const { data: boats = [] } = useBoats(tenantId);
  const { data: team = [] } = useTeamMembers(tenantId);
  const coaches = useMemo(() => team.filter((t) => t.role === "coach" || t.role === "staff" || t.role === "coordinator"), [team]);

  const createMut = useCreateClass(tenantId);
  const updateMut = useUpdateClass();
  const deleteMut = useDeleteClass();
  const toggleMut = useToggleClassActive();
  const cancelMut = useCreateCancellation(tenantId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState<ClassInput>(EMPTY);
  const [confirmDel, setConfirmDel] = useState<ClassRow | null>(null);
  const [cancelOpen, setCancelOpen] = useState<ClassRow | null>(null);
  const [cancelDate, setCancelDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [cancelReason, setCancelReason] = useState("");

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, venue_id: venues[0]?.id ?? "" });
    setDialogOpen(true);
  };

  const onEdit = (c: ClassRow) => {
    setEditing(c);
    setForm(classToInput(c));
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.name.trim() || !form.venue_id) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: form, currentRules: editing.rules_json },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const onCancelSubmit = () => {
    if (!cancelOpen) return;
    cancelMut.mutate(
      { class_id: cancelOpen.id, date: cancelDate, reason: cancelReason || null },
      {
        onSuccess: () => {
          setCancelOpen(null);
          setCancelReason("");
        },
      },
    );
  };

  const activeCount = classes.filter((c) => c.active).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Aulas"
        sub="GESTÃO DE TURMAS"
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
        {/* Filtros */}
        <div className="space-y-2 mb-3">
          <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] font-bold">
            FILTRAR POR DIA
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterWeekday(null)}
              className={cn(
                "hv-chip cursor-pointer",
                filterWeekday === null && "!bg-hv-navy !text-white",
              )}
            >
              TODOS
            </button>
            {WEEKDAYS_LABELS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setFilterWeekday(w.value)}
                className={cn(
                  "hv-chip cursor-pointer",
                  filterWeekday === w.value && "!bg-hv-navy !text-white",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>

          <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] font-bold mt-2">
            NÍVEL
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterLevel(null)}
              className={cn(
                "hv-chip cursor-pointer",
                filterLevel === null && "!bg-hv-navy !text-white",
              )}
            >
              TODOS
            </button>
            {CLASS_LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setFilterLevel(l.value)}
                className={cn(
                  "hv-chip cursor-pointer",
                  filterLevel === l.value && "!bg-hv-navy !text-white",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-hv-text-3 mt-1">
            {activeCount} de {classes.length} ativa{classes.length === 1 ? "" : "s"}
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : classes.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhuma turma cadastrada com esses filtros.
          </div>
        ) : (
          classes.map((c) => (
            <div
              key={c.id}
              className="hv-card mb-2.5"
              style={{ padding: 14, opacity: c.active ? 1 : 0.6 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="hv-mono text-[11px] font-bold text-hv-text">
                      {WEEKDAYS_LABELS[c.weekday]?.label} · {c.start_time.slice(0, 5)} → {c.end_time.slice(0, 5)}
                    </div>
                    {c.level && (
                      <span
                        className="hv-chip"
                        style={{
                          background: "rgba(37,199,229,0.18)",
                          color: "hsl(var(--hv-cyan))",
                        }}
                      >
                        {CLASS_LEVELS.find((l) => l.value === c.level)?.label}
                      </span>
                    )}
                  </div>
                  <div className="font-display font-bold text-[16px] mt-1 truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5">
                    {c.venue?.name ?? "Sem local"}
                    {c.boat?.name ? ` · ${c.boat.name}` : ""}
                    {c.max_capacity ? ` · cap. ${c.max_capacity}` : ""}
                  </div>
                  {c.instructor?.full_name && (
                    <div className="text-[11px] text-hv-text-3 mt-0.5">
                      Coach: {c.instructor.full_name}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })}
                  className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
                  style={{
                    background: c.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-[10px] bg-white"
                    style={{
                      transform: c.active ? "translateX(18px)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  className="py-2 rounded-[8px] text-[11px] font-semibold text-hv-text"
                  style={{
                    background: "hsl(var(--hv-bg))",
                    border: "1px solid hsl(var(--hv-line))",
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/aulas/${c.id}`)}
                  className="py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                  style={{ background: "hsl(var(--hv-navy))" }}
                >
                  Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelOpen(c);
                    setCancelDate(new Date().toISOString().slice(0, 10));
                    setCancelReason("");
                  }}
                  className="py-2 rounded-[8px] text-[11px] font-semibold"
                  style={{
                    background: "rgba(242,181,68,0.2)",
                    color: "hsl(var(--hv-amber))",
                  }}
                >
                  Cancelar próximas
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDel(c)}
                  className="py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                  style={{ background: "hsl(var(--hv-coral))" }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar turma" : "Nova turma"}
        subtitle="TURMA DA FILIAL"
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
              disabled={createMut.isPending || updateMut.isPending || !form.name.trim() || !form.venue_id}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.name.trim() || !form.venue_id ? 0.5 : 1,
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
          placeholder="Ex.: OC6 Iniciante manhã"
        />
        <FieldSelect
          label="Dia da semana"
          required
          value={String(form.weekday) as string}
          options={WEEKDAYS_LABELS.map((w) => ({ value: String(w.value), label: w.full }))}
          onChange={(v) => setForm({ ...form, weekday: Number(v) })}
          placeholderOption="— selecionar —"
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="block mb-2.5">
            <div className="text-[12px] font-semibold text-hv-text mb-1">Início *</div>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
              style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
            />
          </label>
          <label className="block mb-2.5">
            <div className="text-[12px] font-semibold text-hv-text mb-1">Fim *</div>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
              style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
            />
          </label>
        </div>
        <FieldSelect
          label="Local"
          required
          value={form.venue_id || ""}
          options={venues.map((v) => ({ value: v.id, label: v.name }))}
          onChange={(v) => setForm({ ...form, venue_id: v || "" })}
        />
        <FieldSelect
          label="Embarcação"
          value={form.boat_id ?? ""}
          options={boats.map((b) => ({ value: b.id, label: `${b.name} (${b.type})` }))}
          onChange={(v) => setForm({ ...form, boat_id: v || null })}
          placeholderOption="— sem embarcação —"
        />
        <FieldNumber
          label="Capacidade máx."
          value={form.max_capacity}
          onChange={(v) => setForm({ ...form, max_capacity: v })}
          min={1}
        />
        <FieldSelect
          label="Nível"
          required
          value={form.level}
          options={CLASS_LEVELS}
          onChange={(v) => v && setForm({ ...form, level: v as ClassLevel })}
        />
        <FieldSelect
          label="Nível requerido"
          value={form.level_required ?? ""}
          options={CLASS_LEVELS}
          onChange={(v) => setForm({ ...form, level_required: (v || null) as ClassLevel | null })}
          placeholderOption="— sem requisito —"
        />
        <FieldSelect
          label="Instrutor"
          value={form.instructor_id ?? ""}
          options={coaches.map((c) => ({ value: c.user_id, label: c.full_name }))}
          onChange={(v) => setForm({ ...form, instructor_id: v || null })}
          placeholderOption="— sem instrutor —"
        />
        <FieldToggle
          label="Turma ativa"
          checked={form.active}
          onChange={(v) => setForm({ ...form, active: v })}
        />
      </Modal>

      {/* Cancel next Dialog */}
      <Modal
        open={!!cancelOpen}
        onClose={() => setCancelOpen(null)}
        title="Cancelar aula"
        subtitle={cancelOpen?.name?.toUpperCase()}
        maxWidth={400}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCancelOpen(null)}
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
              onClick={onCancelSubmit}
              disabled={cancelMut.isPending || !cancelDate}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{ background: "hsl(var(--hv-coral))" }}
            >
              {cancelMut.isPending ? "Aguarde..." : "Cancelar aula"}
            </button>
          </>
        }
      >
        <label className="block mb-2.5">
          <div className="text-[12px] font-semibold text-hv-text mb-1">Data *</div>
          <input
            type="date"
            value={cancelDate}
            onChange={(e) => setCancelDate(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
            style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
          />
        </label>
        <FieldText
          label="Motivo"
          value={cancelReason}
          onChange={setCancelReason}
          placeholder="Ex.: mau tempo"
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir turma?"
        message={`A turma "${confirmDel?.name}" será removida. Matrículas e checkins relacionados podem ser perdidos.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
