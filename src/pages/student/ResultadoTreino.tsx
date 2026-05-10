// Resultado Treino — tela de sucesso pós-sessão com gradient ocean + waves.

import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { useTrainingSession } from "@/hooks/useTrainingSessions";
import { Loader } from "@/components/Loader";

export default function StudentResultadoTreino() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useTrainingSession(id);

  if (isLoading) return <Loader />;

  const exCount = data?.exercises.length ?? 0;
  const title = data?.session.title || "Sessão";

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden"
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

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur grid place-items-center mb-6 animate-pulse-ring">
          <HVIcon name="check" size={56} stroke={3} color="white" />
        </div>
        <div className="hv-mono text-[11px] uppercase tracking-[0.18em] opacity-80 mb-3">
          MAHALO!
        </div>
        <h1 className="font-display text-[36px] leading-[1.05] text-white mb-3">
          Sessão completa
        </h1>
        <p className="text-[14px] opacity-85 max-w-[280px] leading-[1.5]">
          {exCount > 0
            ? `Você completou ${exCount} exercício${exCount === 1 ? "" : "s"} da sessão "${title}". A próxima rema mais leve, herói.`
            : "Mais uma sessão na conta. A próxima rema mais leve, herói."}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-[320px]">
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">EX.</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">
              {exCount}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">TEMPO</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">
              45m
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-[16px] p-3 border border-white/15">
            <div className="hv-mono text-[10px] opacity-70 tracking-wider">RPE</div>
            <div className="font-display text-[22px] font-extrabold mt-0.5">7</div>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-8 pt-2 space-y-2.5">
        <button
          type="button"
          onClick={() => navigate("/evolucao")}
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
