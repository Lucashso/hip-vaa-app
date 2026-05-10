// CoachCrew — tripulação OC6 (organização de assentos).
// Adaptado do HVCoachCrew (equipe-extras.jsx).

import { useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useCrewTemplates } from "@/hooks/useAlunos";
import { cn, getInitial } from "@/lib/utils";

const FALLBACK_SEATS = [
  { p: 1, nome: "Aroha Silva", role: "Steerer · marcação", c: "#FF6B4A", peso: "68kg" },
  { p: 2, nome: "Kai Nakoa", role: "Stroker · ritmo", c: "#1B6FB0", peso: "78kg" },
  { p: 3, nome: "Lani Souza", role: "Engine", c: "#2FB37A", peso: "82kg" },
  { p: 4, nome: "Tane Kalani", role: "Engine", c: "#F2B544", peso: "85kg" },
  { p: 5, nome: "Noa Hara", role: "Caller · troca", c: "#25C7E5", peso: "74kg" },
  { p: 6, nome: "Manu Akana", role: "Steerer · timão", c: "#7B2D9F", peso: "72kg" },
];

const SEAT_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#F2B544", "#25C7E5", "#7B2D9F"];
const SEAT_ROLES = [
  "Steerer · marcação",
  "Stroker · ritmo",
  "Engine",
  "Engine",
  "Caller · troca",
  "Steerer · timão",
];

export default function CoachCrew() {
  const { profile } = useAuth();
  const { data: templates, isLoading } = useCrewTemplates(profile?.tenant_id);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);

  const activeTemplate = templates?.[activeTemplateIdx];

  const seats = useMemo(() => {
    if (!activeTemplate) return FALLBACK_SEATS;
    const positions = [1, 2, 3, 4, 5, 6];
    return positions.map((p) => {
      const seat = activeTemplate.seats.find((s) => s.seat_position === p);
      const name = seat?.student?.full_name || seat?.staff?.full_name || `Assento ${p}`;
      return {
        p,
        nome: name,
        role: SEAT_ROLES[p - 1],
        c: SEAT_COLORS[p - 1],
        peso: "—",
      };
    });
  }, [activeTemplate]);

  return (
    <PageScaffold
      eyebrow="QUI 09 MAIO · 06:00 · AVANÇADO"
      title="Tripulação OC6"
      back
      showTabBar={false}
      trailing={
        <button
          type="button"
          className="px-3 py-2 rounded-[10px] bg-hv-navy text-white text-xs font-bold"
        >
          Salvar
        </button>
      }
    >
      {/* Chips de templates */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {(templates && templates.length > 0
          ? templates.map((t, i) => ({ l: t.name, on: i === activeTemplateIdx, idx: i, plus: false }))
          : [{ l: "Hoje", on: true, idx: 0, plus: false }, { l: "Travessia 18mai", on: false, idx: 1, plus: false }, { l: "Treino base", on: false, idx: 2, plus: false }]
        ).map((t, i) => (
          <button
            type="button"
            key={i}
            onClick={() => "idx" in t && setActiveTemplateIdx(t.idx)}
            className={cn(
              "shrink-0 hv-chip cursor-pointer",
              t.on
                ? "!bg-hv-navy !text-white"
                : "!bg-hv-surface !text-hv-text-2 border border-hv-line",
            )}
          >
            {t.l}
          </button>
        ))}
        <button
          type="button"
          className="shrink-0 hv-chip !bg-transparent !text-hv-text-2 border border-dashed border-hv-line cursor-pointer"
        >
          + template
        </button>
      </div>

      {/* Canoa visualização */}
      <div
        className="hv-card relative overflow-hidden text-white"
        style={{
          padding: "18px 18px 14px",
          background: "linear-gradient(180deg, #061826, #0E3A5F)",
        }}
      >
        <svg viewBox="0 0 320 100" className="absolute left-0 right-0 bottom-0 w-full opacity-40">
          <path d="M0 60 Q80 40 160 60 T320 60 L320 100 L0 100Z" fill="rgba(37,199,229,0.4)" />
          <path d="M0 80 Q80 60 160 80 T320 80 L320 100 L0 100Z" fill="rgba(37,199,229,0.6)" />
        </svg>
        <div className="hv-mono text-[10px] tracking-[0.16em] opacity-70">
          {activeTemplate?.boat?.name?.toUpperCase() || "OC6 · NÁHIA"}
        </div>
        <div className="font-display font-bold text-[18px] mt-0.5 text-white">
          {activeTemplate?.name || "Tripulação titular"}
        </div>

        {/* assentos */}
        <div className="mx-auto mt-4 mb-1 relative" style={{ maxWidth: 84 }}>
          <svg viewBox="0 0 84 360" className="absolute inset-0 w-full h-full">
            <path
              d="M42 6 Q12 30 12 80 L12 320 Q12 350 42 354 Q72 350 72 320 L72 80 Q72 30 42 6Z"
              fill="none"
              stroke="rgba(37,199,229,0.35)"
              strokeWidth="1.5"
            />
            <path
              d="M42 6 L42 354"
              stroke="rgba(37,199,229,0.15)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          </svg>
          <div className="relative flex flex-col gap-2.5 py-[18px]">
            {seats.map((s) => (
              <div key={s.p} className="flex justify-center">
                <div
                  className="relative grid place-items-center font-display font-extrabold text-white text-[16px]"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: s.c,
                    border: "3px solid rgba(37,199,229,0.55)",
                  }}
                >
                  {getInitial(s.nome)}
                  <span
                    className="hv-mono absolute font-bold"
                    style={{
                      left: -22,
                      top: 14,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {s.p}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* lista de assentos */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-4 mb-1">
        Assentos · arraste para reorganizar
      </h3>
      <div className="hv-card overflow-hidden">
        {isLoading && !templates ? (
          <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">Carregando tripulação…</div>
        ) : (
          seats.map((s, i, arr) => (
            <div
              key={s.p}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5",
                i < arr.length - 1 && "border-b border-hv-line",
              )}
            >
              <div
                className="grid place-items-center font-mono font-bold"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: "hsl(var(--hv-bg))",
                  color: "hsl(var(--hv-text-2))",
                  fontSize: 12,
                }}
              >
                {s.p}
              </div>
              <div
                className="grid place-items-center font-display font-bold text-white"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: s.c,
                }}
              >
                {getInitial(s.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold truncate">{s.nome}</div>
                <div className="text-[11px] text-hv-text-3 mt-px">{s.role}</div>
              </div>
              <span className="hv-mono text-[11px] text-hv-text-3 tracking-[0.04em]">
                {s.peso}
              </span>
              <HVIcon name="menu" size={16} color="hsl(var(--hv-text-3))" />
            </div>
          ))
        )}
      </div>
    </PageScaffold>
  );
}
