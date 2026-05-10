// Checkin — hero ocean + lista de matrículas hoje (link pra fazer check-in).

import { useNavigate } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyEnrolledClasses } from "@/hooks/useStudent";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";

export default function StudentCheckin() {
  const navigate = useNavigate();
  const { data: student } = useMyStudent();
  const { data: enrolled = [] } = useMyEnrolledClasses(student?.id);

  const todayWeekday = new Date().getDay();
  const todayClasses = enrolled.filter((c) => c.weekday === todayWeekday);

  return (
    <PageScaffold eyebrow="SUA TURMA" title="Check-in">
      {/* Hero QR */}
      <div
        className="relative overflow-hidden rounded-[24px] p-[22px] text-white"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 55%, hsl(var(--hv-blue)) 100%)",
        }}
      >
        <div className="relative flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-white/85">
          <span
            className="w-[7px] h-[7px] rounded-full bg-hv-cyan"
            style={{ boxShadow: "0 0 0 4px hsl(var(--hv-cyan) / 0.25)" }}
          />
          AO VIVO · CHECK-IN ABERTO
        </div>

        {/* QR pseudo */}
        <div className="relative my-[22px] mx-auto w-[220px] h-[220px] bg-white rounded-[20px] p-4">
          <svg viewBox="0 0 21 21" className="w-full h-full block" shapeRendering="crispEdges">
            {Array.from({ length: 21 }).flatMap((_, y) =>
              Array.from({ length: 21 }).map((_, x) => {
                const inFinder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
                if (inFinder) return null;
                if ((x * 31 + y * 17) % 7 > 3) {
                  return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="hsl(var(--hv-ink))" />;
                }
                return null;
              }),
            )}
            {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width="7" height="7" fill="hsl(var(--hv-ink))" />
                <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
                <rect x={x + 2} y={y + 2} width="3" height="3" fill="hsl(var(--hv-ink))" />
              </g>
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="w-11 h-11 rounded-[12px] bg-white grid place-items-center shadow-md">
              <HVLogo size={32} color="hsl(var(--hv-navy))" />
            </div>
          </div>
        </div>

        <div className="text-center mt-2">
          <div className="font-mono text-[11px] tracking-[0.14em] text-white/70">ALUNO</div>
          <div className="font-display text-[18px] font-bold mt-0.5">{(student?.id || "").slice(0, 6).toUpperCase()}</div>
        </div>
      </div>

      {/* Aulas de hoje */}
      <div>
        <h3 className="hv-eyebrow mb-2">Suas aulas de hoje</h3>
        {todayClasses.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhuma aula matriculada hoje.
          </div>
        ) : (
          <div className="space-y-2">
            {todayClasses.map((c) => (
              <div key={c.id} className="hv-card p-4 flex items-center gap-3">
                <div className="font-mono text-[12px] font-bold w-16">
                  {c.start_time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[15px] truncate">{c.venue?.name}</div>
                  <div className="text-[11px] text-hv-text-3 truncate">{c.venue?.address}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fallback PIN */}
      <button
        type="button"
        onClick={() => navigate("/checkin/pin")}
        className="hv-card w-full p-3.5 flex items-center gap-3 hover:bg-hv-foam/40 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy font-mono text-[10px] font-bold tracking-wider">
          PIN
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold">Sem internet? Use o PIN</div>
          <div className="text-[11px] text-hv-text-2">Digite seu código no totem</div>
        </div>
        <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
      </button>
    </PageScaffold>
  );
}
