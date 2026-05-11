// Resultado Treino — tela pós-sessão com stats reais + Strava reconfirm.

import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import {
  useSessionById,
  usePendingStravaImport,
  useConfirmStravaImport,
} from "@/hooks/useTraining";
import { toast } from "sonner";

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return "—";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}min`;
}

export default function StudentResultadoTreino() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSessionById(id);
  const { data: pendingImport } = usePendingStravaImport(id);
  const confirmStrava = useConfirmStravaImport();

  if (isLoading) return <Loader />;

  const exCount = data?.exercises.length ?? 0;
  const title = data?.session.title || "Sessão";

  // Extract stats from results_json (saved by useSaveWorkoutResults)
  const results = (data?.session.results_json ?? {}) as {
    total_time_seconds?: number;
    perceived_effort?: number | null;
  };
  const totalSeconds = results.total_time_seconds ?? 0;
  const rpe = results.perceived_effort ?? null;
  const stravaId = data?.session.strava_activity_id ?? null;

  const handleConfirmStrava = () => {
    if (!pendingImport) return;
    confirmStrava.mutate(pendingImport.id, {
      onSuccess: () => toast.success("Dados Strava confirmados!"),
      onError: (err: Error) => toast.error(err.message || "Erro ao confirmar Strava"),
    });
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 50%, hsl(var(--hv-blue)) 100%)",
      }}
    >
      {/* waves */}
      <svg
        viewBox="0 0 360 240"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 w-full h-[50%] pointer-events-none"
      >
        <path
          d="M0 160 Q 90 130 180 160 T 360 160 L 360 240 L 0 240Z"
          fill="hsl(var(--hv-cyan) / 0.18)"
        />
        <path
          d="M0 190 Q 90 162 180 190 T 360 190 L 360 240 L 0 240Z"
          fill="hsl(var(--hv-cyan) / 0.28)"
        />
        <path
          d="M0 215 Q 90 200 180 215 T 360 215 L 360 240 L 0 240Z"
          fill="hsl(var(--hv-cyan) / 0.45)"
        />
      </svg>

      {/* sun glow */}
      <div
        className="absolute -right-12 -top-12 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--hv-amber) / 0.4), transparent 65%)",
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center pt-12 pb-4">
        <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur grid place-items-center mb-6 animate-pulse-ring">
          <HVIcon name="check" size={56} stroke={3} color="white" />
        </div>
        <div className="hv-mono text-[11px] uppercase tracking-[0.18em] opacity-80 mb-3">
          MAHALO!
        </div>
        <h1 className="font-display text-[32px] leading-[1.05] text-white mb-3">
          Sessão registrada
        </h1>
        <p className="text-[14px] opacity-85 max-w-[280px] leading-[1.5]">
          {exCount > 0
            ? `${exCount} exercício${exCount === 1 ? "" : "s"} na sessão "${title}". A próxima rema mais leve, herói.`
            : "Mais uma sessão na conta. A próxima rema mais leve, herói."}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-[320px]">
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">EX.</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">{exCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">TEMPO</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">
              {totalSeconds > 0 ? formatDuration(totalSeconds) : "—"}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">RPE</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">
              {rpe ?? "—"}
            </div>
          </div>
        </div>

        {/* Strava badge */}
        {stravaId && (
          <a
            href={`https://www.strava.com/activities/${stravaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hv-chip mt-5 inline-flex items-center gap-1.5 bg-[#FC4C02] text-white"
          >
            <HVIcon name="check" size={12} stroke={3} color="white" />
            Strava
          </a>
        )}

        {/* Strava pending confirm card */}
        {pendingImport && (
          <div className="hv-card mt-5 w-full max-w-[340px] p-4 text-left bg-white/95 text-foreground">
            <div className="hv-mono text-[10px] tracking-[0.16em] text-[#FC4C02] mb-1">
              STRAVA
            </div>
            <div className="font-display text-[15px] font-bold mb-1">
              Confirmar dados do Strava
            </div>
            <div className="text-[12px] text-hv-text-2 mb-3">
              Detectamos uma atividade Strava associada a esta sessão. Confirme para vincular.
            </div>
            <button
              type="button"
              onClick={handleConfirmStrava}
              disabled={confirmStrava.isPending}
              className="w-full py-2.5 rounded-[12px] bg-[#FC4C02] text-white font-bold text-sm disabled:opacity-50"
            >
              {confirmStrava.isPending ? "Confirmando…" : "Confirmar dados Strava"}
            </button>
          </div>
        )}
      </div>

      {/* Student feedback */}
      {data?.session.student_feedback && (
        <div className="relative px-5 pb-3">
          <div className="hv-card max-w-md mx-auto p-3 bg-white/10 backdrop-blur border border-white/15 text-white">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider mb-1">FEEDBACK</div>
            <div className="text-[13px] opacity-95">{data.session.student_feedback}</div>
          </div>
        </div>
      )}

      <div className="relative px-5 pb-8 pt-2 space-y-2.5">
        <button
          type="button"
          onClick={() => navigate("/student/evolucao")}
          className="w-full py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm active:scale-[0.97] transition-transform inline-flex items-center justify-center gap-2"
        >
          Ver minha evolução
          <HVIcon name="arrow-right" size={16} stroke={2.4} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-[14px] bg-white/10 backdrop-blur border border-white/15 text-white font-semibold text-sm"
        >
          Voltar pro início
        </button>
      </div>
    </div>
  );
}
