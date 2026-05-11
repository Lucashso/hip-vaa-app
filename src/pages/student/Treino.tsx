// Treino — execução de sessão de treino (wire real).
// - Lista exercícios reais com completed toggle (state local) e campos editáveis.
// - Cronômetro contador desde mount.
// - Finalizar treino → RPE + feedback → useSaveWorkoutResults (status=completed).
// - Pular treino → motivo → useSkipWorkout (status=skipped).

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import {
  useSessionById,
  useSaveWorkoutResults,
  useSkipWorkout,
  type TrainingExercise,
} from "@/hooks/useTraining";
import { cn } from "@/lib/utils";

interface LocalExerciseState {
  completed: boolean;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  pace_seconds: number | null;
}

function isCardio(ex: TrainingExercise): boolean {
  const t = (ex.exercise_type || "").toLowerCase();
  return t === "cardio" || t === "endurance" || t === "running" || t === "row";
}

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentTreino() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSessionById(id);
  const saveResults = useSaveWorkoutResults();
  const skipWorkout = useSkipWorkout();

  // Timer
  const [startedAt] = useState(() => new Date());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [startedAt]);

  // Local state for editable per-exercise fields
  const [exState, setExState] = useState<Record<string, LocalExerciseState>>({});
  useEffect(() => {
    if (!data?.exercises) return;
    setExState((prev) => {
      const next = { ...prev };
      data.exercises.forEach((e) => {
        if (!next[e.id]) {
          next[e.id] = {
            completed: false,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight_kg,
            distance_meters: e.distance_meters,
            duration_seconds: e.duration_seconds,
            pace_seconds: e.target_pace_seconds,
          };
        }
      });
      return next;
    });
  }, [data?.exercises]);

  // Modal state
  const [showFinish, setShowFinish] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [rpe, setRpe] = useState<number>(7);
  const [feedback, setFeedback] = useState("");
  const [skipReason, setSkipReason] = useState("");

  const total = data?.exercises.length ?? 0;
  const completedCount = useMemo(
    () => Object.values(exState).filter((s) => s.completed).length,
    [exState],
  );
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (isLoading) return <Loader />;
  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="hv-card p-6 text-center max-w-sm">
          <div className="font-display text-[18px]">Sessão não encontrada</div>
          <div className="text-sm text-hv-text-2 mt-1.5">
            A sessão de treino não existe ou você não tem acesso.
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 rounded-[12px] bg-hv-navy text-white text-sm font-bold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const { session, exercises } = data;

  const toggleCompleted = (id: string) => {
    setExState((prev) => ({
      ...prev,
      [id]: { ...prev[id], completed: !prev[id]?.completed },
    }));
  };

  const updateField = <K extends keyof LocalExerciseState>(
    id: string,
    key: K,
    value: LocalExerciseState[K],
  ) => {
    setExState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const handleFinalize = () => {
    if (!session.id) return;
    saveResults.mutate(
      {
        sessionId: session.id,
        results: {
          exercises: exercises.map((e) => {
            const s = exState[e.id] ?? {
              completed: false,
              sets: e.sets,
              reps: e.reps,
              weight_kg: e.weight_kg,
              distance_meters: e.distance_meters,
              duration_seconds: e.duration_seconds,
              pace_seconds: e.target_pace_seconds,
            };
            return {
              id: e.id,
              exercise_name: e.exercise_name,
              completed: s.completed,
              sets: s.sets,
              reps: s.reps,
              weight_kg: s.weight_kg,
              distance_meters: s.distance_meters,
              duration_seconds: s.duration_seconds,
              pace_seconds: s.pace_seconds,
            };
          }),
          total_time_seconds: elapsed,
          perceived_effort: rpe,
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
        },
        studentFeedback: feedback.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Sessão finalizada!");
          navigate(`/student/treino/${session.id}/resultado`);
        },
        onError: (err: Error) => {
          toast.error(err.message || "Erro ao salvar sessão");
        },
      },
    );
  };

  const handleSkip = () => {
    if (!session.id) return;
    skipWorkout.mutate(
      { sessionId: session.id, reason: skipReason.trim() },
      {
        onSuccess: () => {
          toast.success("Sessão marcada como pulada.");
          navigate(`/student/treino/${session.id}/resultado`);
        },
        onError: (err: Error) => {
          toast.error(err.message || "Erro ao pular sessão");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top */}
      <div className="px-4 pt-3.5 pb-3.5 bg-hv-navy text-white">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-[10px] bg-white/15 grid place-items-center text-white"
          >
            <HVIcon name="chevron-left" size={18} />
          </button>
          <div className="hv-mono flex-1 text-[10px] opacity-70 tracking-[0.16em]">
            SESSÃO · {(session.title || "TREINO").toUpperCase()}
          </div>
          <span
            className="hv-chip"
            style={{ background: "rgba(255,107,74,0.25)", color: "hsl(var(--hv-coral))" }}
          >
            {formatTimer(elapsed)}
          </span>
        </div>
        <h1 className="text-white font-display text-[22px] mt-2 leading-tight">
          {session.title || "Sessão de treino"}
        </h1>
        {/* progresso */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-hv-cyan transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="hv-mono text-[11px] font-bold">
            {completedCount} / {total}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 pb-40">
        {exercises.length === 0 && (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Sessão sem exercícios cadastrados.
          </div>
        )}
        {exercises.map((e, i) => {
          const s = exState[e.id];
          const done = s?.completed ?? false;
          const cardio = isCardio(e);

          return (
            <div
              key={e.id}
              className={cn(
                "hv-card p-3.5 mb-2 transition-all",
                done ? "border border-hv-leaf/40" : "border border-hv-line",
              )}
              style={{ opacity: done ? 0.72 : 1 }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleCompleted(e.id)}
                  className={cn(
                    "w-8 h-8 rounded-[10px] grid place-items-center font-extrabold font-display text-white shrink-0",
                    done ? "bg-hv-leaf" : "bg-hv-bg text-hv-text-3",
                  )}
                  aria-label={done ? "Marcar pendente" : "Marcar concluído"}
                >
                  {done ? <HVIcon name="check" size={16} stroke={3} color="white" /> : i + 1}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", done && "line-through")}>
                    {e.exercise_name}
                  </div>
                  <div className="hv-mono text-[11px] text-hv-text-3 mt-0.5 tracking-wide">
                    {cardio ? "Cardio" : "Força"}
                    {e.notes ? ` · ${e.notes}` : ""}
                  </div>
                </div>
                {e.video_url && (
                  <a
                    href={e.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[30px] h-[30px] rounded-[8px] bg-hv-foam text-hv-navy grid place-items-center shrink-0"
                  >
                    <HVIcon name="play" size={14} />
                  </a>
                )}
              </div>

              {/* Campos editáveis */}
              <div className="mt-3 pt-3 border-t border-hv-line grid grid-cols-3 gap-2">
                {!cardio ? (
                  <>
                    <NumField
                      label="Séries"
                      value={s?.sets ?? null}
                      onChange={(v) => updateField(e.id, "sets", v)}
                    />
                    <NumField
                      label="Reps"
                      value={s?.reps ?? null}
                      onChange={(v) => updateField(e.id, "reps", v)}
                    />
                    <NumField
                      label="Carga (kg)"
                      value={s?.weight_kg ?? null}
                      onChange={(v) => updateField(e.id, "weight_kg", v)}
                      step={0.5}
                    />
                  </>
                ) : (
                  <>
                    <NumField
                      label="Dist. (m)"
                      value={s?.distance_meters ?? null}
                      onChange={(v) => updateField(e.id, "distance_meters", v)}
                    />
                    <NumField
                      label="Dur. (s)"
                      value={s?.duration_seconds ?? null}
                      onChange={(v) => updateField(e.id, "duration_seconds", v)}
                    />
                    <NumField
                      label="Pace (s/km)"
                      value={s?.pace_seconds ?? null}
                      onChange={(v) => updateField(e.id, "pace_seconds", v)}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed left-0 right-0 bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto space-y-2">
          <button
            type="button"
            onClick={() => setShowFinish(true)}
            className="w-full py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm active:scale-[0.97] transition-transform"
          >
            Finalizar treino
          </button>
          <button
            type="button"
            onClick={() => setShowSkip(true)}
            className="w-full py-3 rounded-[14px] bg-transparent border border-hv-line text-hv-text-2 font-semibold text-sm"
          >
            Pular treino
          </button>
        </div>
      </div>

      {/* Finalizar modal */}
      {showFinish && (
        <Modal onClose={() => setShowFinish(false)}>
          <div className="font-display text-[18px] mb-1">Finalizar sessão</div>
          <div className="text-sm text-hv-text-2 mb-4">Como foi a sessão hoje?</div>

          <div className="hv-mono text-[10px] text-hv-text-3 tracking-[1px] mb-1.5">
            ESFORÇO PERCEBIDO (RPE 1-10)
          </div>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
              const on = n <= rpe;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRpe(n)}
                  className="flex-1 h-9 rounded-md border border-hv-line grid place-items-center text-[12px] font-bold"
                  style={{
                    background: on ? `hsl(${200 - n * 12}, 70%, 55%)` : "hsl(var(--hv-bg))",
                    color: on ? "white" : "hsl(var(--hv-text-3))",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <label className="hv-mono text-[10px] text-hv-text-3 tracking-[1px] mb-1.5 block">
            FEEDBACK (OPCIONAL)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Como você se sentiu?"
            rows={3}
            className="w-full rounded-[12px] border border-hv-line bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-hv-navy"
          />

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowFinish(false)}
              className="flex-1 py-3 rounded-[12px] border border-hv-line text-hv-text-2 font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={saveResults.isPending}
              className="flex-1 py-3 rounded-[12px] bg-hv-cyan text-hv-ink font-bold text-sm disabled:opacity-50"
            >
              {saveResults.isPending ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Pular modal */}
      {showSkip && (
        <Modal onClose={() => setShowSkip(false)}>
          <div className="font-display text-[18px] mb-1">Pular treino</div>
          <div className="text-sm text-hv-text-2 mb-4">Por que está pulando hoje?</div>

          <textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="Motivo (ex: descanso, lesão, agenda…)"
            rows={4}
            className="w-full rounded-[12px] border border-hv-line bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-hv-navy"
          />

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowSkip(false)}
              className="flex-1 py-3 rounded-[12px] border border-hv-line text-hv-text-2 font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipWorkout.isPending}
              className="flex-1 py-3 rounded-[12px] bg-hv-coral text-white font-bold text-sm disabled:opacity-50"
            >
              {skipWorkout.isPending ? "Salvando…" : "Pular sessão"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="hv-mono text-[9px] text-hv-text-3 tracking-[1px] block mb-1">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? 1}
        value={value == null ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const num = Number(raw);
          onChange(Number.isFinite(num) ? num : null);
        }}
        className="w-full h-9 rounded-[10px] border border-hv-line bg-background px-2 text-sm text-center focus-visible:outline-none focus-visible:border-hv-navy"
      />
    </label>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="hv-card p-5 max-w-sm w-full bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
