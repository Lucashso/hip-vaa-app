// InstrutorEvolucao — evolução do aluno (mobile).
// Adaptado do HVInstrutorEvolucao (instrutor.jsx) — stats + chart SVG + anotações.

import { useParams } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "92%", label: "Frequência" },
  { value: "13", label: "Streak" },
  { value: "Av+", label: "Nível" },
];

const NOTES = [
  { date: "07 MAI", text: "Entrada da pá com bom ângulo. Ajustar timing no #2." },
  { date: "30 ABR", text: "Resistência muito boa em alta cadência (24+ spm)." },
  { date: "23 ABR", text: "Pediu indicação de remo carbono — sugeri Vaa Pro." },
];

export default function InstrutorEvolucao() {
  useParams<{ studentId: string }>();

  return (
    <PageScaffold
      eyebrow="EVOLUÇÃO · OC6 AVANÇADO"
      title="Kai Nakoa"
      back
      showTabBar={false}
    >
      {/* Stats 3 colunas */}
      <div className="hv-card p-3.5 flex gap-2.5">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex-1 text-center",
              i < STATS.length - 1 && "border-r border-hv-line",
            )}
          >
            <div className="font-display font-extrabold text-[22px] leading-none text-hv-navy">
              {s.value}
            </div>
            <div className="text-[10px] text-hv-text-3 uppercase tracking-wider font-semibold mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-4 mb-1">
        Frequência últimos 90 dias
      </h3>
      <div className="hv-card p-4">
        <svg viewBox="0 0 320 120" className="w-full h-[120px] block" preserveAspectRatio="none">
          <defs>
            <linearGradient id="freqArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--hv-cyan))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--hv-cyan))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="320"
              y2={y}
              stroke="hsl(var(--hv-line))"
              strokeDasharray="2,3"
            />
          ))}
          <path
            d="M0 60 L 30 50 L 60 70 L 90 40 L 120 30 L 150 45 L 180 25 L 210 35 L 240 20 L 270 28 L 300 18 L 320 22 L 320 120 L 0 120Z"
            fill="url(#freqArea)"
          />
          <path
            d="M0 60 L 30 50 L 60 70 L 90 40 L 120 30 L 150 45 L 180 25 L 210 35 L 240 20 L 270 28 L 300 18 L 320 22"
            fill="none"
            stroke="hsl(var(--hv-blue))"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {[
            [0, 60],
            [60, 70],
            [120, 30],
            [180, 25],
            [240, 20],
            [300, 18],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="white"
              stroke="hsl(var(--hv-blue))"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* Notes */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-4 mb-1">
        Anotações da técnica
      </h3>
      <div className="hv-card overflow-hidden">
        {NOTES.map((n, i) => (
          <div
            key={i}
            className={cn(
              "px-3.5 py-3.5",
              i < NOTES.length - 1 && "border-b border-hv-line",
            )}
          >
            <div className="font-mono text-[10px] text-hv-text-3 tracking-wider font-semibold">
              {n.date}
            </div>
            <div className="text-[13px] mt-1 leading-relaxed text-hv-text">{n.text}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full py-3.5 rounded-[14px] bg-hv-foam text-hv-navy font-semibold text-[13px] inline-flex items-center justify-center gap-2"
        style={{ border: "1px dashed hsl(var(--hv-blue))" }}
      >
        <HVIcon name="plus" size={16} stroke={2.4} />
        Nova anotação
      </button>
    </PageScaffold>
  );
}
