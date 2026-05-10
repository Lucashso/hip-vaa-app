// Avulso (drop-in) — reserva de aula avulsa: dias + turmas + PIX.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HVIcon } from "@/lib/HVIcon";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/lib/supabase";
import { cn, formatBRL } from "@/lib/utils";

interface AvulsoClass {
  id: string;
  tenant_id: string;
  venue_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  max_capacity: number | null;
  venue: { id: string; name: string; address: string | null } | null;
  coach_user_id: string | null;
}

interface CoachRef {
  id: string;
  full_name: string | null;
}

function useAvailableClasses(tenantId?: string) {
  return useQuery({
    queryKey: ["avulso-classes", tenantId],
    queryFn: async (): Promise<{ classes: AvulsoClass[]; coaches: Map<string, string> }> => {
      if (!tenantId) return { classes: [], coaches: new Map() };
      const { data, error } = await supabase
        .from("classes")
        .select("id, tenant_id, venue_id, weekday, start_time, end_time, active, max_capacity, coach_user_id, venues(id, name, address)")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("start_time", { ascending: true });
      if (error) throw error;
      const classes = ((data || []) as Array<AvulsoClass & { venues?: AvulsoClass["venue"] | AvulsoClass["venue"][] }>).map((c) => ({
        ...c,
        venue: Array.isArray(c.venues) ? c.venues[0] ?? null : c.venues ?? null,
      })) as AvulsoClass[];

      const coachIds = Array.from(
        new Set(classes.map((c) => c.coach_user_id).filter((x): x is string => !!x)),
      );
      let coachMap = new Map<string, string>();
      if (coachIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", coachIds);
        coachMap = new Map(
          ((profs as CoachRef[]) || []).map((p) => [p.id, p.full_name || ""]),
        );
      }
      return { classes, coaches: coachMap };
    },
    enabled: !!tenantId,
  });
}

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES_BR_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function nextDays(count = 7): Date[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return d;
  });
}

export default function StudentAvulso() {
  const navigate = useNavigate();
  const { data: tenant } = useTenant();
  const { data, isLoading } = useAvailableClasses(tenant?.id);
  const classes = data?.classes ?? [];
  const coaches = data?.coaches ?? new Map<string, string>();

  const dropInPriceCents = tenant?.drop_in_price_cents ?? 6000;
  const dropInPriceLabel = formatBRL(dropInPriceCents);

  const days = useMemo(() => nextDays(7), []);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const selectedDay = days[selectedDayIdx];
  const selectedWeekday = selectedDay.getDay();

  const dayClasses = classes.filter((c) => c.weekday === selectedWeekday);
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header gradient */}
      <div
        className="px-5 pt-4 pb-3.5 text-white"
        style={{ background: "linear-gradient(135deg, #061826, #1B6FB0)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-[10px] bg-white/15 grid place-items-center text-white"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <h1 className="text-white font-display text-[24px] mt-3">Aula avulsa</h1>
        <p className="text-[13px] opacity-85 mt-1 leading-[1.5]">
          Sem matrícula. Você reserva uma aula, paga e remarca quando quiser.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-8">
        {/* Days */}
        <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mb-2.5">
          Escolha o dia
        </h3>
        <div className="flex gap-2 overflow-x-auto mb-3.5 -mx-1 px-1">
          {days.map((d, i) => {
            const active = i === selectedDayIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedDayIdx(i);
                  setSelectedClassId(null);
                }}
                className={cn(
                  "shrink-0 px-3.5 py-2.5 rounded-[12px] border text-center min-w-[60px] transition-colors",
                  active
                    ? "bg-hv-navy text-white border-hv-navy"
                    : "bg-hv-surface text-foreground border-hv-line",
                )}
              >
                <div
                  className={cn(
                    "hv-mono text-[9px] tracking-wide",
                    active ? "opacity-80" : "text-hv-text-3",
                  )}
                >
                  {WEEKDAY_LABELS[d.getDay()]}
                </div>
                <div className="font-display text-[18px] font-bold mt-0.5">
                  {String(d.getDate()).padStart(2, "0")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Turmas com vaga */}
        <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mb-2.5">
          Turmas com vaga · {WEEKDAY_LABELS[selectedWeekday].toLowerCase()},{" "}
          {selectedDay.getDate()} {MONTH_NAMES_BR_SHORT[selectedDay.getMonth()]}
        </h3>

        {isLoading ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Carregando turmas…
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Sem aulas nesse dia. Tenta outro dia da semana.
          </div>
        ) : (
          dayClasses.map((c) => {
            const cap = c.max_capacity ?? 12;
            // Mock: vagas variando determinístico por id
            const vagas = (parseInt(c.id.slice(0, 4), 16) % cap) || cap;
            const lotada = vagas === 0;
            const isSelected = selectedClassId === c.id;
            const coachName = c.coach_user_id ? coaches.get(c.coach_user_id) : "";
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => !lotada && setSelectedClassId(c.id)}
                disabled={lotada}
                className={cn(
                  "w-full text-left hv-card p-3.5 mb-2 transition-all",
                  isSelected ? "border-2 border-hv-cyan" : "border border-hv-line",
                )}
                style={{ opacity: lotada ? 0.55 : 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[50px]">
                    <div className="hv-mono font-display font-extrabold text-[18px] text-hv-navy">
                      {c.start_time?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">
                      {c.venue?.name || "Aula avulsa"}
                    </div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {c.venue?.address || "—"}
                      {coachName ? ` · ${coachName.split(" ")[0]}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    {lotada ? (
                      <span className="hv-chip bg-hv-bg text-hv-text-3">lotada</span>
                    ) : (
                      <>
                        <div
                          className="font-display font-bold text-sm"
                          style={{
                            color:
                              vagas <= 2
                                ? "hsl(var(--hv-coral))"
                                : "hsl(var(--hv-leaf))",
                          }}
                        >
                          {vagas} vagas
                        </div>
                        <div className="hv-mono text-[9px] text-hv-text-3 tracking-wide">
                          {dropInPriceLabel}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}

        {/* Resumo */}
        {selectedClass && (
          <div
            className="hv-card p-3.5 mt-3.5 bg-hv-foam"
            style={{ border: "1px solid rgba(37,199,229,0.3)" }}
          >
            <div className="flex justify-between mb-1">
              <span className="text-[13px] font-semibold">
                {selectedClass.venue?.name || "Aula avulsa"} ·{" "}
                {selectedClass.start_time?.slice(0, 5)}
              </span>
              <span className="font-display font-extrabold">
                {dropInPriceLabel}
              </span>
            </div>
            <div className="text-[11px] text-hv-text-2">
              + taxa de pranchão (opcional) · R$ 10
            </div>
            <button
              type="button"
              className="w-full mt-3 py-3 rounded-[12px] bg-hv-navy text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              Reservar e pagar com Pix
              <HVIcon name="qr" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
