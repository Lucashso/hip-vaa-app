// InstrutorAulas — agenda do instrutor (mobile).
// Adaptado do HVInstrutorAulas (instrutor.jsx) — header navy + cards de aula.

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { HVIcon } from "@/lib/HVIcon";
import { cn, getInitial } from "@/lib/utils";

type AulaStatus = "agora" | "proximo" | "tarde";

interface Aula {
  hora: string;
  fim: string;
  turma: string;
  local: string;
  check: number;
  total: number;
  status: AulaStatus;
  classId: string;
}

const AULAS: Aula[] = [
  { hora: "06:00", fim: "07:30", turma: "OC6 Avançado", local: "Praia da Costa", check: 8, total: 14, status: "agora", classId: "oc6-avancado" },
  { hora: "08:00", fim: "09:30", turma: "OC6 Iniciante", local: "Praia da Costa", check: 0, total: 12, status: "proximo", classId: "oc6-iniciante" },
  { hora: "18:00", fim: "19:30", turma: "Técnica V1", local: "Píer", check: 0, total: 8, status: "tarde", classId: "tecnica-v1" },
];

export default function InstrutorAulas() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: tenant } = useTenant();

  const firstName = (profile?.full_name || "Instrutor").split(" ")[0];
  const tenantName = (tenant?.name || "Vila Velha").toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header navy */}
      <div className="bg-hv-navy text-white">
        <div className="max-w-md mx-auto px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] grid place-items-center font-display font-extrabold bg-white/15 text-white">
              {getInitial(profile?.full_name)}
            </div>
            <div className="flex-1 leading-tight min-w-0">
              <div className="font-mono text-[10px] opacity-70 tracking-[0.16em] font-semibold">
                INSTRUTOR · {tenantName}
              </div>
              <div className="font-display text-[16px] font-bold mt-0.5 text-white truncate">
                {firstName}
              </div>
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-[12px] grid place-items-center text-white"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <HVIcon name="bell" size={18} />
            </button>
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] opacity-70 tracking-[0.2em]">
              QUI · 09 MAIO · 03 AULAS HOJE
            </div>
            <h1 className="font-display text-[28px] mt-1 text-white">
              34 alunos esperam
            </h1>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-md mx-auto px-4 py-5 space-y-3">
        <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
          Sua agenda
        </h3>

        <div className="flex flex-col gap-3">
          {AULAS.map((a) => (
            <div
              key={a.classId}
              className={cn(
                "rounded-[14px] overflow-hidden bg-hv-surface",
                a.status === "agora"
                  ? "border-2 border-hv-cyan"
                  : "border border-hv-line",
              )}
            >
              <div className="p-3.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="font-mono text-xs font-bold text-hv-text">
                    {a.hora} → {a.fim}
                  </div>
                  {a.status === "agora" && (
                    <span
                      className="hv-chip !bg-hv-cyan !text-hv-ink"
                    >
                      ● AGORA
                    </span>
                  )}
                  {a.status === "proximo" && <span className="hv-chip">EM 1H</span>}
                </div>
                <div className="font-display font-bold text-[18px] mt-1.5">
                  {a.turma}
                </div>
                <div className="text-xs text-hv-text-2 mt-0.5">{a.local}</div>

                <div className="flex items-center mt-3 gap-3">
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-hv-text-3 tracking-wider">
                      CHECK-INS
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "font-display font-extrabold text-[22px] leading-none",
                          a.status === "agora" ? "text-hv-leaf" : "text-hv-text",
                        )}
                      >
                        {a.check}
                      </span>
                      <span className="text-xs text-hv-text-3">/ {a.total}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/chamada/${a.classId}`)}
                    className={cn(
                      "px-4 py-2.5 rounded-[12px] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors",
                      a.status === "agora"
                        ? "bg-hv-navy text-white hover:bg-hv-blue"
                        : "bg-hv-foam text-hv-navy hover:bg-hv-foam/70",
                    )}
                  >
                    {a.status === "agora" ? "Abrir chamada" : "Ver detalhes"}
                    <HVIcon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
