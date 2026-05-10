// Treino — execução de sessão: progresso, lista de exercícios, série ativa, RPE.

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useTrainingSession, type TrainingExercise } from "@/hooks/useTrainingSessions";
import { cn } from "@/lib/utils";

function describeExercise(ex: TrainingExercise): string {
  if (ex.sets && ex.reps) {
    return `${ex.sets}×${ex.reps}`;
  }
  if (ex.duration_seconds) {
    const m = Math.floor(ex.duration_seconds / 60);
    const s = ex.duration_seconds % 60;
    return s ? `${m}min ${s}s` : `${m} min`;
  }
  if (ex.distance_meters) {
    return `${ex.distance_meters}m`;
  }
  return ex.exercise_type || "—";
}

export default function StudentTreino() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useTrainingSession(id);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [doneSet, setDoneSet] = useState<Record<string, number>>({});
  const [rpeBySession, setRpeBySession] = useState<Record<string, number>>({});

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
  const total = exercises.length;
  const completedCount = activeIdx; // exercises antes do ativo são "done"
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

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
            {total} ex
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

      <div className="flex-1 overflow-auto px-4 py-3 pb-28">
        {exercises.length === 0 && (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Sessão sem exercícios cadastrados.
          </div>
        )}
        {exercises.map((e, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const seriesTotal = e.sets || 1;
          const completedSeries = doneSet[e.id] ?? 0;
          const rpe = rpeBySession[e.id] ?? 0;

          return (
            <div
              key={e.id}
              className={cn(
                "hv-card p-3.5 mb-2 transition-all",
                active ? "border-2 border-hv-cyan" : "border border-hv-line",
              )}
              style={{ opacity: done ? 0.62 : 1 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-[10px] grid place-items-center font-extrabold font-display text-white",
                    done
                      ? "bg-hv-leaf"
                      : active
                        ? "bg-hv-cyan text-hv-ink"
                        : "bg-hv-bg text-hv-text-3",
                  )}
                >
                  {done ? (
                    <HVIcon name="check" size={16} stroke={3} color={active ? "hsl(var(--hv-ink))" : "white"} />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      done && "line-through",
                    )}
                  >
                    {e.exercise_name}
                  </div>
                  <div className="hv-mono text-[11px] text-hv-text-3 mt-0.5 tracking-wide">
                    {describeExercise(e)}
                    {e.weight_kg ? ` · ${e.weight_kg} kg` : ""}
                  </div>
                </div>
                {e.video_url && (
                  <a
                    href={e.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[30px] h-[30px] rounded-[8px] bg-hv-foam text-hv-navy grid place-items-center"
                  >
                    <HVIcon name="play" size={14} />
                  </a>
                )}
              </div>
              {active && (
                <div className="mt-3 pt-3 border-t border-hv-line">
                  <div className="flex gap-1.5 mb-2.5">
                    {Array.from({ length: seriesTotal }).map((_, s) => {
                      const sNum = s + 1;
                      const ok = sNum <= completedSeries;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setDoneSet((prev) => ({
                              ...prev,
                              [e.id]: ok ? sNum - 1 : sNum,
                            }))
                          }
                          className={cn(
                            "flex-1 py-2.5 rounded-[10px] font-bold font-mono text-[13px]",
                            ok
                              ? "bg-hv-cyan text-hv-ink"
                              : "border-[1.5px] border-hv-line text-foreground bg-transparent",
                          )}
                        >
                          {ok ? "✓" : `${sNum}ª`}
                        </button>
                      );
                    })}
                  </div>
                  <div className="hv-mono text-[10px] text-hv-text-3 tracking-[1px] mb-1.5">
                    ESFORÇO PERCEBIDO (RPE)
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                      const on = n <= rpe;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setRpeBySession((prev) => ({ ...prev, [e.id]: n }))
                          }
                          className="flex-1 h-7 rounded-md border border-hv-line grid place-items-center text-[11px] font-bold"
                          style={{
                            background: on
                              ? `hsl(${200 - n * 12}, 70%, 55%)`
                              : "hsl(var(--hv-bg))",
                            color: on ? "white" : "hsl(var(--hv-text-3))",
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed left-0 right-0 bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              if (activeIdx < total - 1) {
                setActiveIdx((i) => i + 1);
              } else {
                navigate(`/student/treino/${session.id}/resultado`);
              }
            }}
            className="w-full py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm active:scale-[0.97] transition-transform"
          >
            {activeIdx < total - 1 ? "Próximo exercício →" : "Concluir sessão →"}
          </button>
        </div>
      </div>
    </div>
  );
}
