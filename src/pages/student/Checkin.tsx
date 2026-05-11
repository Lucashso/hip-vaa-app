// Checkin — hero ocean + lista de matrículas hoje com botão de check-in inline.

import { useEffect, useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyEnrolledClasses } from "@/hooks/useStudent";
import {
  useTodayCheckins,
  useCreateCheckin,
  useDeleteCheckin,
} from "@/hooks/useCheckins";
import { HVIcon } from "@/lib/HVIcon";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function StudentCheckin() {
  const { data: student } = useMyStudent();
  const { data: enrolled = [] } = useMyEnrolledClasses(student?.id);
  const { data: todayCheckins = [] } = useTodayCheckins(student?.id);
  const createCheckin = useCreateCheckin();
  const deleteCheckin = useDeleteCheckin();

  const todayWeekday = new Date().getDay();
  const todayClasses = enrolled.filter((c) => c.weekday === todayWeekday);

  const checkinByClass = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of todayCheckins) {
      map.set(c.class_id, c.id);
    }
    return map;
  }, [todayCheckins]);

  // Relógio atualizando a cada minuto.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <PageScaffold eyebrow="SUA TURMA" title="Check-in">
      {/* Hero ocean gradient — sem QR */}
      <div
        className="relative overflow-hidden rounded-[24px] p-6 text-white"
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

        <div className="mt-6 text-center">
          <div className="font-display text-[28px] leading-tight">Bom treino</div>
          <div className="hv-mono text-[42px] font-extrabold tracking-tight mt-2">
            {formatTime(now)}
          </div>
          <div className="hv-mono text-[10px] tracking-[0.16em] text-white/70 mt-2">
            ALUNO · {(student?.id || "").slice(0, 6).toUpperCase()}
          </div>
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
            {todayClasses.map((c) => {
              const checkinId = checkinByClass.get(c.id);
              const isCheckedIn = !!checkinId;
              const isPending =
                (createCheckin.isPending && createCheckin.variables?.classId === c.id) ||
                (deleteCheckin.isPending && deleteCheckin.variables === checkinId);

              return (
                <div key={c.id} className="hv-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[12px] font-bold w-16">
                      {c.start_time?.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] truncate">
                        {c.venue?.name}
                      </div>
                      <div className="text-[11px] text-hv-text-3 truncate">
                        {c.venue?.address}
                      </div>
                    </div>
                    {isCheckedIn && (
                      <span className="hv-chip bg-hv-foam text-hv-leaf font-bold flex items-center gap-1">
                        <HVIcon name="check" size={12} color="hsl(var(--hv-leaf))" stroke={2.4} />
                        Confirmado
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {isCheckedIn ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => checkinId && deleteCheckin.mutate(checkinId)}
                        className="flex-1 h-10 rounded-[12px] border border-hv-line bg-hv-surface text-foreground text-[13px] font-semibold disabled:opacity-50"
                      >
                        Cancelar check-in
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending || !student?.id}
                        onClick={() =>
                          student?.id &&
                          createCheckin.mutate({ studentId: student.id, classId: c.id })
                        }
                        className="flex-1 h-10 rounded-[12px] bg-hv-navy text-white text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                      >
                        {isPending ? "Confirmando…" : "Fazer check-in"}
                        {!isPending && <HVIcon name="check" size={14} stroke={2.4} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
