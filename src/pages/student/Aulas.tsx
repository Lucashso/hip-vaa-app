// Aulas — week pills + filtro filial + lista das aulas do dia selecionado.

import { useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useAuth } from "@/hooks/useAuth";
import { useMyStudent, useMyEnrolledClasses } from "@/hooks/useStudent";
import { HVIcon } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MONTHS_BR = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

export default function StudentAulas() {
  const { profile: _profile } = useAuth();
  void _profile;
  const { data: student } = useMyStudent();
  const { data: enrolled = [] } = useMyEnrolledClasses(student?.id);

  const today = new Date();
  const [selectedWeekday, setSelectedWeekday] = useState<number>(today.getDay());
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const venues = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of enrolled) {
      if (c.venue?.id && c.venue.name) map.set(c.venue.id, c.venue.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [enrolled]);

  const dayClasses = useMemo(() => {
    return enrolled
      .filter((c) => c.weekday === selectedWeekday)
      .filter((c) => !selectedVenue || c.venue?.id === selectedVenue)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [enrolled, selectedWeekday, selectedVenue]);

  const eyebrow = `${MONTHS_BR[today.getMonth()]}·${today.getFullYear()}`;

  return (
    <PageScaffold eyebrow={eyebrow} title="Suas aulas">
      {/* Week pills */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {WEEK_LABELS.map((label, idx) => {
          const isActive = idx === selectedWeekday;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedWeekday(idx)}
              className={cn(
                "flex-1 min-w-[44px] h-14 rounded-[14px] grid place-items-center font-mono text-[11px] tracking-wider font-bold transition-all active:scale-[0.96]",
                isActive
                  ? "bg-hv-navy text-white border border-hv-navy"
                  : "bg-hv-surface text-hv-text-2 border border-hv-line hover:bg-hv-foam",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Filtros de filial */}
      {venues.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          <button
            type="button"
            onClick={() => setSelectedVenue(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
              !selectedVenue
                ? "bg-hv-navy text-white"
                : "bg-hv-foam text-hv-navy",
            )}
          >
            Todas filiais
          </button>
          {venues.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVenue(v.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                selectedVenue === v.id
                  ? "bg-hv-navy text-white"
                  : "bg-hv-foam text-hv-navy",
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {dayClasses.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="calendar" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">Dia tranquilo</div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[240px] mx-auto">
            Nenhuma aula matriculada em {WEEK_LABELS[selectedWeekday]}. Escolha outro dia da semana.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {dayClasses.map((c) => (
            <div key={c.id} className="hv-card p-4 flex items-center gap-4">
              <div className="flex flex-col items-start">
                <div className="font-mono text-[10px] text-hv-text-3 tracking-wider">INÍCIO</div>
                <div className="font-display text-[20px] font-extrabold text-hv-navy leading-none mt-0.5">
                  {c.start_time?.slice(0, 5)}
                </div>
                <div className="font-mono text-[10px] text-hv-text-3 mt-1">
                  até {c.end_time?.slice(0, 5)}
                </div>
              </div>
              <div className="w-px h-12 bg-hv-line" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-[15px] truncate">
                  {c.venue?.name || "Filial"}
                </div>
                <div className="text-[11px] text-hv-text-3 truncate flex items-center gap-1">
                  <HVIcon name="pin" size={12} />
                  {c.venue?.address || "Endereço não cadastrado"}
                </div>
              </div>
              <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
            </div>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
