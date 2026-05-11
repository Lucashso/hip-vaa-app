// Admin · Biblioteca — 2 tabs (Treinos | Exercícios) com CRUD completo.

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useExerciseLibrary, type ExerciseLibraryItem } from "@/hooks/useExerciseLibrary";
import {
  useWorkoutTemplates,
  useCreateWorkoutTemplate,
  useUpdateWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useDuplicateWorkoutTemplate,
  useWorkoutTemplateExercises,
  useSaveWorkoutTemplateExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  type WorkoutTemplate,
  type WorkoutTemplateExercise,
} from "@/hooks/useWorkoutLibrary";

type Tab = "treinos" | "exercicios";

const CAT_COLORS: Record<string, string> = {
  forca: "hsl(var(--hv-coral))",
  força: "hsl(var(--hv-coral))",
  strength: "hsl(var(--hv-coral))",
  cardio: "hsl(var(--hv-amber))",
  tecnica: "hsl(var(--hv-blue))",
  técnica: "hsl(var(--hv-blue))",
  mobilidade: "hsl(var(--hv-leaf))",
  default: "hsl(var(--hv-blue))",
};

const EXERCISE_TYPES = [
  { id: "strength", label: "Força" },
  { id: "cardio", label: "Cardio" },
  { id: "tecnica", label: "Técnica" },
  { id: "mobilidade", label: "Mobilidade" },
];

function colorFor(type: string | null): string {
  if (!type) return CAT_COLORS.default;
  return CAT_COLORS[type.toLowerCase()] ?? CAT_COLORS.default;
}

const inputStyle = {
  width: "100%",
  marginTop: 4,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid hsl(var(--hv-line))",
  background: "white",
  fontSize: 13,
  outline: "none",
} as const;

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: "hsl(var(--hv-text-2))",
  letterSpacing: 1.1,
} as const;

function Backdrop({ onClick, children, width = 480 }: { onClick: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 24, 38, 0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function AdminBiblioteca() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const [tab, setTab] = useState<Tab>("treinos");

  const { data: templates = [], isLoading: loadingTemplates } = useWorkoutTemplates(tenantId);
  const { data: exercises = [], isLoading: loadingExercises } = useExerciseLibrary(tenantId);

  // Template state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [tplForm, setTplForm] = useState({ name: "", description: "" });
  const [editingTemplateExercises, setEditingTemplateExercises] = useState<WorkoutTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<WorkoutTemplate | null>(null);

  const createTplMut = useCreateWorkoutTemplate();
  const updateTplMut = useUpdateWorkoutTemplate();
  const deleteTplMut = useDeleteWorkoutTemplate();
  const duplicateTplMut = useDuplicateWorkoutTemplate();

  // Exercise state
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);
  const [exForm, setExForm] = useState({
    name: "",
    description: "",
    exercise_type: "strength",
    muscle_group: "",
    video_url: "",
  });
  const [deletingExercise, setDeletingExercise] = useState<ExerciseLibraryItem | null>(null);

  const createExMut = useCreateExercise();
  const updateExMut = useUpdateExercise();
  const deleteExMut = useDeleteExercise();

  const openTemplateNew = () => {
    setEditingTemplate(null);
    setTplForm({ name: "", description: "" });
    setShowTemplateDialog(true);
  };
  const openTemplateEdit = (t: WorkoutTemplate) => {
    setEditingTemplate(t);
    setTplForm({ name: t.name, description: t.description });
    setShowTemplateDialog(true);
  };
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !tplForm.name) return;
    if (editingTemplate) {
      await updateTplMut.mutateAsync({
        id: editingTemplate.id,
        name: tplForm.name,
        description: tplForm.description,
      });
    } else {
      await createTplMut.mutateAsync({
        tenant_id: tenantId,
        name: tplForm.name,
        description: tplForm.description,
      });
    }
    setShowTemplateDialog(false);
  };

  const openExerciseNew = () => {
    setEditingExercise(null);
    setExForm({
      name: "",
      description: "",
      exercise_type: "strength",
      muscle_group: "",
      video_url: "",
    });
    setShowExerciseDialog(true);
  };
  const openExerciseEdit = (ex: ExerciseLibraryItem) => {
    setEditingExercise(ex);
    setExForm({
      name: ex.name,
      description: ex.description ?? "",
      exercise_type: ex.exercise_type ?? "strength",
      muscle_group: ex.muscle_group ?? "",
      video_url: ex.video_url ?? "",
    });
    setShowExerciseDialog(true);
  };
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !exForm.name) return;
    if (editingExercise) {
      await updateExMut.mutateAsync({
        id: editingExercise.id,
        name: exForm.name,
        description: exForm.description || null,
        exercise_type: exForm.exercise_type || null,
        muscle_group: exForm.muscle_group || null,
        video_url: exForm.video_url || null,
      });
    } else {
      await createExMut.mutateAsync({
        tenant_id: tenantId,
        name: exForm.name,
        description: exForm.description || null,
        exercise_type: exForm.exercise_type || null,
        muscle_group: exForm.muscle_group || null,
        video_url: exForm.video_url || null,
      });
    }
    setShowExerciseDialog(false);
  };

  // Exercise filter state
  const [exCat, setExCat] = useState<string>("all");
  const exCats = useMemo(() => {
    const map: Record<string, number> = {};
    exercises.forEach((e) => {
      const t = e.exercise_type || e.muscle_group || "outros";
      map[t] = (map[t] || 0) + 1;
    });
    return map;
  }, [exercises]);
  const filteredExercises = useMemo(() => {
    if (exCat === "all") return exercises;
    return exercises.filter(
      (e) => (e.exercise_type || e.muscle_group) === exCat,
    );
  }, [exercises, exCat]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Biblioteca de treinos"
        sub={
          tab === "treinos"
            ? `${templates.length} TREINO${templates.length === 1 ? "" : "S"}`
            : `${exercises.length} EXERCÍCIO${exercises.length === 1 ? "" : "S"}`
        }
        action={
          <button
            type="button"
            onClick={tab === "treinos" ? openTemplateNew : openExerciseNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} />
            Novo
          </button>
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "8px 16px",
          background: "hsl(var(--hv-surface))",
          borderBottom: "1px solid hsl(var(--hv-line))",
        }}
      >
        {(["treinos", "exercicios"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              background: tab === t ? "hsl(var(--hv-navy))" : "transparent",
              color: tab === t ? "white" : "hsl(var(--hv-text-2))",
              cursor: "pointer",
            }}
          >
            {t === "treinos" ? "Treinos" : "Exercícios"}
          </button>
        ))}
      </div>

      {tab === "treinos" && (
        <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
          {loadingTemplates ? (
            <Loader />
          ) : templates.length === 0 ? (
            <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
              Nenhum treino criado. Clique em "Novo" pra começar.
            </div>
          ) : (
            <div className="hv-card overflow-hidden p-0">
              {templates.map((t, i, arr) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] grid place-items-center text-white shrink-0"
                    style={{ background: "hsl(var(--hv-navy))" }}
                  >
                    <HVIcon name="trophy" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{t.name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {t.exercise_count} exercício{t.exercise_count === 1 ? "" : "s"}
                      {t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTemplateExercises(t)}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                    title="Editar exercícios"
                  >
                    <HVIcon name="dumbbell" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openTemplateEdit(t)}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                    title="Editar"
                  >
                    <HVIcon name="pin" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateTplMut.mutate(t.id)}
                    disabled={duplicateTplMut.isPending}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                    title="Duplicar"
                  >
                    <HVIcon name="copy" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTemplate(t)}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-coral))" }}
                    title="Excluir"
                  >
                    <HVIcon name="x" size={14} stroke={2.4} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "exercicios" && (
        <>
          <Chips
            items={[
              { l: `Todos · ${exercises.length}`, on: exCat === "all", onClick: () => setExCat("all") },
              ...Object.entries(exCats).map(([k, n]) => ({
                l: `${k} · ${n}`,
                on: exCat === k,
                onClick: () => setExCat(k),
              })),
            ]}
          />
          <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
            {loadingExercises ? (
              <Loader />
            ) : filteredExercises.length === 0 ? (
              <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
                Nenhum exercício na biblioteca.
              </div>
            ) : (
              <div className="hv-card overflow-hidden p-0">
                {filteredExercises.map((e, i, arr) => {
                  const c = colorFor(e.exercise_type || e.muscle_group);
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: "12px 14px",
                        borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-[10px] grid place-items-center text-white shrink-0"
                        style={{ background: c }}
                      >
                        <HVIcon name="dumbbell" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate">{e.name}</div>
                        {(e.exercise_type || e.muscle_group) && (
                          <span
                            className="hv-chip mt-1"
                            style={{
                              background: "hsl(var(--hv-bg))",
                              color: "hsl(var(--hv-text-2))",
                            }}
                          >
                            {e.exercise_type || e.muscle_group}
                          </span>
                        )}
                      </div>
                      {e.video_url && (
                        <a
                          href={e.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                          style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                          title="Ver vídeo"
                        >
                          <HVIcon name="play" size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openExerciseEdit(e)}
                        className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                        style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                        title="Editar"
                      >
                        <HVIcon name="pin" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingExercise(e)}
                        className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                        style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-coral))" }}
                        title="Excluir"
                      >
                        <HVIcon name="x" size={14} stroke={2.4} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialog Template create/edit */}
      {showTemplateDialog && (
        <Backdrop onClick={() => !createTplMut.isPending && !updateTplMut.isPending && setShowTemplateDialog(false)}>
          <form onSubmit={handleSaveTemplate} className="hv-card" style={{ padding: 22 }}>
            <div className="hv-mono" style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}>
              {editingTemplate ? "EDITAR TREINO" : "NOVO TREINO"}
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, marginTop: 4, marginBottom: 16, fontWeight: 700 }}>
              Template de treino
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>Nome</label>
              <input value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="hv-mono" style={labelStyle}>Descrição</label>
              <textarea
                value={tplForm.description}
                onChange={(e) => setTplForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowTemplateDialog(false)} disabled={createTplMut.isPending || updateTplMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))", fontSize: 13, fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="submit" disabled={createTplMut.isPending || updateTplMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-navy))", color: "white", border: "none", fontSize: 13, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                {(createTplMut.isPending || updateTplMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </form>
        </Backdrop>
      )}

      {/* Sheet Template exercises */}
      {editingTemplateExercises && (
        <TemplateExercisesSheet
          template={editingTemplateExercises}
          onClose={() => setEditingTemplateExercises(null)}
        />
      )}

      {/* Confirm delete template */}
      {deletingTemplate && (
        <Backdrop onClick={() => !deleteTplMut.isPending && setDeletingTemplate(null)}>
          <div className="hv-card" style={{ padding: 22 }}>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, marginBottom: 8, fontWeight: 700 }}>
              Excluir treino?
            </h3>
            <div style={{ fontSize: 13, color: "hsl(var(--hv-text-2))", lineHeight: 1.5 }}>
              Tem certeza que deseja excluir <strong>{deletingTemplate.name}</strong>? Os exercícios atribuídos também serão removidos.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={() => setDeletingTemplate(null)} disabled={deleteTplMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))", fontSize: 13, fontWeight: 600 }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTplMut.mutateAsync(deletingTemplate.id);
                  setDeletingTemplate(null);
                }}
                disabled={deleteTplMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-coral))", color: "white", border: "none", fontSize: 13, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}
              >
                {deleteTplMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* Dialog Exercise create/edit */}
      {showExerciseDialog && (
        <Backdrop onClick={() => !createExMut.isPending && !updateExMut.isPending && setShowExerciseDialog(false)}>
          <form onSubmit={handleSaveExercise} className="hv-card" style={{ padding: 22 }}>
            <div className="hv-mono" style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}>
              {editingExercise ? "EDITAR EXERCÍCIO" : "NOVO EXERCÍCIO"}
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, marginTop: 4, marginBottom: 16, fontWeight: 700 }}>
              Exercício
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>Nome</label>
              <input value={exForm.name} onChange={(e) => setExForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>Descrição</label>
              <textarea
                value={exForm.description}
                onChange={(e) => setExForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label className="hv-mono" style={labelStyle}>Tipo</label>
                <select value={exForm.exercise_type} onChange={(e) => setExForm((f) => ({ ...f, exercise_type: e.target.value }))} style={inputStyle}>
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="hv-mono" style={labelStyle}>Grupo muscular</label>
                <input value={exForm.muscle_group} onChange={(e) => setExForm((f) => ({ ...f, muscle_group: e.target.value }))} placeholder="ex: peitoral" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="hv-mono" style={labelStyle}>URL do vídeo</label>
              <input value={exForm.video_url} onChange={(e) => setExForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowExerciseDialog(false)} disabled={createExMut.isPending || updateExMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))", fontSize: 13, fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="submit" disabled={createExMut.isPending || updateExMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-navy))", color: "white", border: "none", fontSize: 13, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                {(createExMut.isPending || updateExMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </form>
        </Backdrop>
      )}

      {/* Confirm delete exercise */}
      {deletingExercise && (
        <Backdrop onClick={() => !deleteExMut.isPending && setDeletingExercise(null)}>
          <div className="hv-card" style={{ padding: 22 }}>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, marginBottom: 8, fontWeight: 700 }}>
              Excluir exercício?
            </h3>
            <div style={{ fontSize: 13, color: "hsl(var(--hv-text-2))", lineHeight: 1.5 }}>
              Tem certeza que deseja excluir <strong>{deletingExercise.name}</strong>?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={() => setDeletingExercise(null)} disabled={deleteExMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))", fontSize: 13, fontWeight: 600 }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteExMut.mutateAsync(deletingExercise.id);
                  setDeletingExercise(null);
                }}
                disabled={deleteExMut.isPending}
                style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-coral))", color: "white", border: "none", fontSize: 13, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}
              >
                {deleteExMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}

// ───────────────────── Sheet de exercícios do template ─────────────────────

function emptyExerciseRow(): Omit<WorkoutTemplateExercise, "id" | "template_id"> {
  return {
    exercise_name: "",
    exercise_type: "strength",
    sets: null,
    reps: null,
    weight_kg: null,
    duration_seconds: null,
    distance_meters: null,
    target_pace_seconds: null,
    rest_seconds: null,
    notes: null,
    video_url: null,
    sort_order: 0,
  };
}

function TemplateExercisesSheet({
  template,
  onClose,
}: {
  template: WorkoutTemplate;
  onClose: () => void;
}) {
  const { data: existing = [], isLoading } = useWorkoutTemplateExercises(template.id);
  const saveMut = useSaveWorkoutTemplateExercises();
  const [rows, setRows] = useState<Omit<WorkoutTemplateExercise, "id" | "template_id">[] | null>(null);

  const list = rows ?? existing.map((e) => ({
    exercise_name: e.exercise_name,
    exercise_type: e.exercise_type,
    sets: e.sets,
    reps: e.reps,
    weight_kg: e.weight_kg,
    duration_seconds: e.duration_seconds,
    distance_meters: e.distance_meters,
    target_pace_seconds: e.target_pace_seconds,
    rest_seconds: e.rest_seconds,
    notes: e.notes,
    video_url: e.video_url,
    sort_order: e.sort_order,
  }));

  const update = (i: number, patch: Partial<Omit<WorkoutTemplateExercise, "id" | "template_id">>) => {
    const next = [...list];
    next[i] = { ...next[i], ...patch };
    setRows(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };
  const remove = (i: number) => {
    setRows(list.filter((_, idx) => idx !== i));
  };
  const add = () => {
    setRows([...list, { ...emptyExerciseRow(), sort_order: list.length }]);
  };

  const handleSave = async () => {
    const clean = list
      .filter((r) => r.exercise_name.trim())
      .map((r, i) => ({ ...r, sort_order: i }));
    await saveMut.mutateAsync({ templateId: template.id, exercises: clean });
    onClose();
  };

  return (
    <Backdrop onClick={() => !saveMut.isPending && onClose()} width={720}>
      <div className="hv-card" style={{ padding: 22 }}>
        <div className="hv-mono" style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}>
          EDITAR EXERCÍCIOS
        </div>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, marginTop: 4, marginBottom: 12, fontWeight: 700 }}>
          {template.name}
        </h3>

        {isLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            {list.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "hsl(var(--hv-text-3))" }}>
                Nenhum exercício. Clique em "Adicionar" pra começar.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {list.map((row, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span className="hv-mono" style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--hv-text-3))", letterSpacing: 1, minWidth: 28 }}>
                      #{i + 1}
                    </span>
                    <input
                      placeholder="Nome do exercício"
                      value={row.exercise_name}
                      onChange={(e) => update(i, { exercise_name: e.target.value })}
                      style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                    />
                    <select
                      value={row.exercise_type ?? "strength"}
                      onChange={(e) => update(i, { exercise_type: e.target.value })}
                      style={{ ...inputStyle, marginTop: 0, width: 120 }}
                    >
                      {EXERCISE_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                      className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                      style={{ background: "hsl(var(--hv-surface))", color: "hsl(var(--hv-text-2))", opacity: i === 0 ? 0.4 : 1 }}>
                      <HVIcon name="chevron-down" size={14} style={{ transform: "rotate(180deg)" }} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1}
                      className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                      style={{ background: "hsl(var(--hv-surface))", color: "hsl(var(--hv-text-2))", opacity: i === list.length - 1 ? 0.4 : 1 }}>
                      <HVIcon name="chevron-down" size={14} />
                    </button>
                    <button type="button" onClick={() => remove(i)}
                      className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                      style={{ background: "hsl(var(--hv-surface))", color: "hsl(var(--hv-coral))" }}>
                      <HVIcon name="x" size={14} stroke={2.4} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {(row.exercise_type === "cardio" || row.exercise_type === "tecnica") ? (
                      <>
                        <NumberCell label="Duração (s)" value={row.duration_seconds} onChange={(v) => update(i, { duration_seconds: v })} />
                        <NumberCell label="Distância (m)" value={row.distance_meters} onChange={(v) => update(i, { distance_meters: v })} />
                        <NumberCell label="Pace (s/km)" value={row.target_pace_seconds} onChange={(v) => update(i, { target_pace_seconds: v })} />
                        <NumberCell label="Descanso (s)" value={row.rest_seconds} onChange={(v) => update(i, { rest_seconds: v })} />
                      </>
                    ) : (
                      <>
                        <NumberCell label="Séries" value={row.sets} onChange={(v) => update(i, { sets: v })} />
                        <NumberCell label="Reps" value={row.reps} onChange={(v) => update(i, { reps: v })} />
                        <NumberCell label="Carga (kg)" value={row.weight_kg} onChange={(v) => update(i, { weight_kg: v })} decimal />
                        <NumberCell label="Descanso (s)" value={row.rest_seconds} onChange={(v) => update(i, { rest_seconds: v })} />
                      </>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                    <div>
                      <label className="hv-mono" style={labelStyle}>URL do vídeo</label>
                      <input
                        value={row.video_url ?? ""}
                        onChange={(e) => update(i, { video_url: e.target.value || null })}
                        placeholder="https://..."
                        style={{ ...inputStyle, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="hv-mono" style={labelStyle}>Notas</label>
                      <input
                        value={row.notes ?? ""}
                        onChange={(e) => update(i, { notes: e.target.value || null })}
                        placeholder="observações"
                        style={{ ...inputStyle, fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={add}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "hsl(var(--hv-foam))",
                color: "hsl(var(--hv-navy))",
                border: "1px dashed hsl(var(--hv-blue))",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                gap: 6,
                alignItems: "center",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <HVIcon name="plus" size={14} stroke={2.6} /> Adicionar exercício
            </button>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" onClick={onClose} disabled={saveMut.isPending}
            style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))", fontSize: 13, fontWeight: 600 }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saveMut.isPending}
            style={{ padding: "10px 16px", borderRadius: 10, background: "hsl(var(--hv-navy))", color: "white", border: "none", fontSize: 13, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
            {saveMut.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar exercícios
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function NumberCell({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimal?: boolean;
}) {
  return (
    <div>
      <label className="hv-mono" style={labelStyle}>{label}</label>
      <input
        type="number"
        step={decimal ? "0.1" : "1"}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(null);
          const n = decimal ? parseFloat(v) : parseInt(v, 10);
          onChange(Number.isFinite(n) ? n : null);
        }}
        style={{ ...inputStyle, fontSize: 12 }}
      />
    </div>
  );
}
