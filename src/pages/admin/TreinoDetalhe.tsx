// Admin · TreinoDetalhe — detalhe de uma sessão de treino (/admin/treino/:sessionId).

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useSessionById, useSkipWorkout } from "@/hooks/useTraining";
import type { TrainingExercise } from "@/hooks/useTraining";

// ─── helpers ───────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  skipped: "Pulado",
  in_progress: "Em andamento",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "hsl(var(--hv-amber))",
  completed: "hsl(var(--hv-leaf))",
  skipped: "hsl(var(--hv-coral))",
  in_progress: "hsl(var(--hv-blue))",
};

function formatDate(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "—";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}min`;
}

function getExerciseLabel(ex: TrainingExercise): string {
  const t = (ex.exercise_type || "strength").toLowerCase();
  if (t === "strength" || t === "força") {
    const parts: string[] = [];
    if (ex.sets) parts.push(`${ex.sets}x`);
    if (ex.reps) parts.push(`${ex.reps} reps`);
    if (ex.weight_kg) parts.push(`${ex.weight_kg}kg`);
    if (ex.rest_seconds) parts.push(`descanso ${ex.rest_seconds}s`);
    return parts.join(" · ") || "—";
  }
  if (t === "cardio" || t === "running" || t === "swimming" || t === "cycling") {
    const parts: string[] = [];
    if (ex.distance_meters) parts.push(`${ex.distance_meters}m`);
    if (ex.duration_seconds) parts.push(formatDuration(ex.duration_seconds));
    if (ex.target_pace_seconds) parts.push(`pace ${ex.target_pace_seconds}s/km`);
    return parts.join(" · ") || "—";
  }
  // duration type
  if (ex.duration_seconds) return formatDuration(ex.duration_seconds);
  return "—";
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

function Backdrop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
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
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── component ─────────────────────────────────────────────

export default function AdminTreinoDetalhe() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, isLoading } = useSessionById(sessionId);
  const skipWorkout = useSkipWorkout();

  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  if (isLoading) return <Loader />;
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader title="Sessão não encontrada" back />
        <div className="max-w-md mx-auto px-4 py-5">
          <div className="hv-card p-6 text-center">
            <div className="font-display text-[16px] font-bold text-hv-text-1">Sessão não encontrada</div>
            <div className="text-[12px] text-hv-text-3 mt-2">A sessão de treino não existe.</div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 rounded-[12px] text-sm font-bold"
              style={{ background: "hsl(var(--hv-navy))", color: "white" }}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { session, exercises } = data;
  const status = session.status ?? "scheduled";

  // Extract results_json
  const results = (session.results_json ?? {}) as {
    total_time_seconds?: number;
    perceived_effort?: number | null;
    exercises?: Array<{
      id: string;
      exercise_name: string;
      completed: boolean;
      sets?: number | null;
      reps?: number | null;
      weight_kg?: number | null;
      distance_meters?: number | null;
      duration_seconds?: number | null;
    }>;
  };

  const handleSkip = async () => {
    if (!session.id) return;
    skipWorkout.mutate(
      { sessionId: session.id, reason: skipReason.trim() },
      {
        onSuccess: () => {
          toast.success("Sessão marcada como pulada");
          setShowSkipDialog(false);
        },
        onError: (err: Error) => toast.error(err.message || "Erro ao pular sessão"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader
        title={session.title || "Sessão de treino"}
        sub="ADMIN · TREINO"
        back
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Info card */}
        <div className="hv-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em]">STATUS</div>
            <span
              className="hv-chip text-white"
              style={{ background: STATUS_COLORS[status] ?? "hsl(var(--hv-text-3))" }}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.12em] mb-0.5">DATA</div>
              <div className="text-[13px] font-semibold capitalize">
                {formatDate(session.session_date)}
              </div>
            </div>
            <div>
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.12em] mb-0.5">EXERCÍCIOS</div>
              <div className="text-[13px] font-semibold">{exercises.length}</div>
            </div>
          </div>

          {session.description && (
            <div>
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.12em] mb-0.5">DESCRIÇÃO</div>
              <div className="text-[13px] text-hv-text-2 leading-relaxed">{session.description}</div>
            </div>
          )}
        </div>

        {/* Exercise list */}
        {exercises.length > 0 && (
          <div>
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-2 px-0.5">
              EXERCÍCIOS
            </div>
            <div className="hv-card overflow-hidden p-0">
              {exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-start gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: i < exercises.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-[8px] grid place-items-center text-white shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--hv-navy))", fontSize: 11, fontWeight: 700 }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold">{ex.exercise_name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5">{getExerciseLabel(ex)}</div>
                    {ex.notes && (
                      <div className="text-[11px] text-hv-text-3 mt-0.5 italic">{ex.notes}</div>
                    )}
                  </div>
                  {ex.video_url && (
                    <a
                      href={ex.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 rounded-[8px] grid place-items-center shrink-0"
                      style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                      title="Ver vídeo"
                    >
                      <HVIcon name="play" size={13} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results (completed) */}
        {status === "completed" && results && (
          <div>
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-2 px-0.5">
              RESULTADO
            </div>
            <div className="hv-card p-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-0.5">TEMPO</div>
                  <div className="font-display text-[20px] font-extrabold text-hv-text-1">
                    {results.total_time_seconds ? formatDuration(results.total_time_seconds) : "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-0.5">RPE</div>
                  <div className="font-display text-[20px] font-extrabold text-hv-text-1">
                    {results.perceived_effort ?? "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-0.5">FEITOS</div>
                  <div className="font-display text-[20px] font-extrabold text-hv-text-1">
                    {results.exercises?.filter((e) => e.completed).length ?? "—"}
                  </div>
                </div>
              </div>

              {session.student_feedback && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "hsl(var(--hv-bg))",
                    borderLeft: "3px solid hsl(var(--hv-blue))",
                  }}
                >
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-1">
                    FEEDBACK DO ALUNO
                  </div>
                  <div className="text-[12px] text-hv-text-2 leading-relaxed">
                    {session.student_feedback}
                  </div>
                </div>
              )}

              {/* Per-exercise results */}
              {results.exercises && results.exercises.length > 0 && (
                <div className="mt-3">
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-2">
                    DETALHES POR EXERCÍCIO
                  </div>
                  <div className="space-y-1.5">
                    {results.exercises.map((re, i) => (
                      <div
                        key={re.id ?? i}
                        className="flex items-center gap-2.5"
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: re.completed
                            ? "hsl(var(--hv-leaf) / 0.1)"
                            : "hsl(var(--hv-bg))",
                          border: `1px solid ${re.completed ? "hsl(var(--hv-leaf) / 0.3)" : "hsl(var(--hv-line))"}`,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full grid place-items-center shrink-0"
                          style={{
                            background: re.completed ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                          }}
                        >
                          {re.completed && <HVIcon name="check" size={10} stroke={3} color="white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate">{re.exercise_name}</div>
                          {(re.sets || re.reps || re.weight_kg || re.distance_meters) && (
                            <div className="text-[10px] text-hv-text-3">
                              {[
                                re.sets && `${re.sets}x`,
                                re.reps && `${re.reps} reps`,
                                re.weight_kg && `${re.weight_kg}kg`,
                                re.distance_meters && `${re.distance_meters}m`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skipped reason */}
        {status === "skipped" && session.student_feedback && (
          <div className="hv-card p-4">
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider mb-1">MOTIVO</div>
            <div className="text-[13px] text-hv-text-2 leading-relaxed">
              {session.student_feedback}
            </div>
          </div>
        )}

        {/* Actions */}
        {status === "scheduled" && (
          <button
            type="button"
            onClick={() => setShowSkipDialog(true)}
            className="w-full py-3 rounded-[12px] border text-sm font-semibold"
            style={{
              borderColor: "hsl(var(--hv-coral))",
              color: "hsl(var(--hv-coral))",
              background: "transparent",
            }}
          >
            Marcar como pulada
          </button>
        )}
      </div>

      {/* Skip dialog */}
      {showSkipDialog && (
        <Backdrop onClick={() => !skipWorkout.isPending && setShowSkipDialog(false)}>
          <div className="hv-card" style={{ padding: 22 }}>
            <div
              className="hv-mono"
              style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}
            >
              MARCAR COMO PULADA
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
                marginTop: 4,
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              Motivo (opcional)
            </h3>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Ex: lesão, ausência, cancelamento..."
              rows={3}
              style={{
                ...inputStyle,
                fontFamily: "inherit",
                resize: "vertical",
                display: "block",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowSkipDialog(false)}
                disabled={skipWorkout.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipWorkout.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-coral))",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {skipWorkout.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}
