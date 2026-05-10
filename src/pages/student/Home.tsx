// Home aluno — Variant A editorial do Hip.zip HVHomeA.
// Header band + Hero próxima aula + stats row + atalhos + banner indicação.

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import {
  useMyStudent,
  useMyEnrolledClasses,
  useMyMonthlyCheckins,
} from "@/hooks/useStudent";
import { useMyCredits } from "@/hooks/useStudent";
import { TabBar } from "@/components/TabBar";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { getInitial } from "@/lib/utils";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function StudentHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: tenant } = useTenant();
  const { data: student, isLoading } = useMyStudent();
  const { data: enrolled = [] } = useMyEnrolledClasses(student?.id);
  const { data: monthlyCheckins = 0 } = useMyMonthlyCheckins(student?.id);
  const { data: credits } = useMyCredits(student?.id);

  if (isLoading) return <Loader />;

  const firstName = (profile?.full_name || "Atleta").split(" ")[0];
  const today = new Date();
  const todayWeekday = today.getDay();
  const todayClass = enrolled.find((c) => c.weekday === todayWeekday);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header band */}
      <div className="bg-hv-surface border-b border-hv-line">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/perfil")}>
            <div className="w-10 h-10 rounded-[12px] bg-hv-navy text-white grid place-items-center font-display font-extrabold text-lg">
              {getInitial(profile?.full_name)}
            </div>
          </button>
          <div className="flex-1 leading-tight min-w-0">
            <div className="hv-eyebrow">Aloha, {firstName}</div>
            <div className="text-sm font-semibold mt-0.5 truncate">
              {tenant?.name || "Hip Va'a"}
            </div>
          </div>
          <button
            type="button"
            className="relative w-10 h-10 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam"
          >
            <HVIcon name="bell" size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* HERO próxima aula */}
        <div
          className="relative overflow-hidden rounded-[22px] text-white p-5"
          style={{
            background:
              "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 55%, hsl(var(--hv-blue)) 100%)",
            minHeight: 240,
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 360 240"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path d="M0 180 Q 90 160 180 180 T 360 180 L 360 240 L 0 240Z" fill="hsl(var(--hv-cyan) / 0.18)" />
            <path d="M0 200 Q 90 178 180 200 T 360 200 L 360 240 L 0 240Z" fill="hsl(var(--hv-cyan) / 0.25)" />
            <circle cx="320" cy="60" r="44" fill="hsl(var(--hv-amber) / 0.18)" />
            <circle cx="320" cy="60" r="26" fill="hsl(var(--hv-amber) / 0.45)" />
          </svg>

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={{ background: "hsl(var(--hv-cyan) / 0.18)", color: "hsl(var(--hv-cyan))" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "hsl(var(--hv-cyan))",
                    boxShadow: "0 0 0 4px hsl(var(--hv-cyan) / 0.25)",
                  }}
                />
                {todayClass ? "Próxima · hoje" : "Sem aulas"}
              </div>
            </div>

            {todayClass ? (
              <>
                <div className="mt-6">
                  <div className="font-mono text-[11px] tracking-[2px] opacity-70">
                    {todayClass.start_time?.slice(0, 5)} — {todayClass.end_time?.slice(0, 5)}
                  </div>
                  <h1 className="font-display text-[34px] leading-[0.95] mt-1.5 text-white">
                    {todayClass.venue?.name || "Remada"}
                  </h1>
                  <div className="mt-2 text-[13px] opacity-80">
                    {`${getGreeting()}, ${firstName}`}
                  </div>
                </div>

                <div className="mt-6 flex gap-2.5">
                  <button
                    onClick={() => navigate("/checkin")}
                    className="flex-1 h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.97]"
                  >
                    <HVIcon name="qr" size={16} stroke={2.2} /> Check-in
                  </button>
                  <button
                    onClick={() => navigate("/aulas")}
                    className="h-12 px-4 rounded-[14px] text-white font-semibold text-[13px]"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    Ver aulas
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <h1 className="font-display text-[28px] text-white leading-tight">
                  Sem remada hoje
                </h1>
                <button
                  onClick={() => navigate("/aulas")}
                  className="mt-4 h-11 px-5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm inline-flex items-center gap-1.5"
                >
                  Ver grade <HVIcon name="arrow-right" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Streak + Créditos */}
        <div className="grid grid-cols-[1.2fr_1fr] gap-3">
          <div className="hv-card p-4">
            <div className="flex items-center gap-2 text-hv-coral">
              <HVIcon name="fire" size={18} stroke={2.2} />
              <span className="font-mono text-[11px] tracking-wider font-bold">CHECK-INS/MÊS</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <div className="font-display font-extrabold text-[36px] leading-none">
                {monthlyCheckins}
              </div>
              <div className="text-xs text-hv-text-2">remadas</div>
            </div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background:
                      i < monthlyCheckins
                        ? "hsl(var(--hv-coral))"
                        : "hsl(var(--hv-line))",
                    opacity: i < monthlyCheckins ? Math.min(0.5 + i * 0.06, 1) : 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="hv-card p-4 bg-hv-foam">
            <div className="flex items-center gap-2 text-hv-navy">
              <HVIcon name="gift" size={18} stroke={2.2} />
              <span className="font-mono text-[11px] tracking-wider font-bold">CRÉDITOS</span>
            </div>
            <div className="font-display font-extrabold text-[28px] leading-tight mt-1.5 text-hv-navy">
              R$ {Math.floor((credits?.available_cents || 0) / 100)}
            </div>
            <button
              onClick={() => navigate("/recompensas")}
              className="mt-1 text-[11px] font-semibold text-hv-blue hover:underline"
            >
              Trocar →
            </button>
          </div>
        </div>

        {/* Banners 2-col Indicações + Passeios */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/indicacao")}
            className="rounded-[18px] p-4 relative overflow-hidden text-left text-white transition-transform active:scale-[0.97]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--hv-coral)) 0%, hsl(var(--hv-amber)) 100%)",
            }}
          >
            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.18em] opacity-80">INDICAÇÕES</div>
              <div className="font-display text-[18px] leading-tight mt-1">Indique<br />& ganhe.</div>
            </div>
            <HVIcon name="share" size={50} stroke={1.5} color="rgba(255,255,255,0.18)" className="absolute -right-1 -bottom-1" />
          </button>

          <button
            onClick={() => navigate("/passeios")}
            className="rounded-[18px] p-4 relative overflow-hidden text-left text-white transition-transform active:scale-[0.97]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-blue)) 100%)",
            }}
          >
            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.18em] opacity-80">PASSEIOS</div>
              <div className="font-display text-[18px] leading-tight mt-1">Travessias<br />da temporada.</div>
            </div>
            <HVIcon name="boat" size={50} stroke={1.5} color="rgba(255,255,255,0.18)" className="absolute -right-1 -bottom-1" />
          </button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
