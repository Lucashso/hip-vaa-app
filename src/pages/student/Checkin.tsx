// Checkin — respeita TenantSettings:
//  - checkin_opens_hours_before / checkin_closes_hours_before → janela de tempo
//  - cancel_hours_before → janela pra cancelar
//  - delinquency_tolerance_days + status='delinquent' → bloqueia inadimplente
//  - class_replacement_enabled → mostra contador de reposições
//  - checkin_ranking_enabled → mostra top 5 da semana
//  - checkin_day_mode → 'today_only' / 'multi_day' / 'dynamic'

import { useEffect, useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useTenant } from "@/hooks/useTenant";
import { useMyStudent, useMyEnrolledClasses, type ClassRow } from "@/hooks/useStudent";
import {
  useTodayCheckins,
  useCreateCheckin,
  useDeleteCheckin,
} from "@/hooks/useCheckins";
import { useUpcomingStudentInvoice, useReplacementCheckinCount } from "@/hooks/useStudentHome";
import { HVIcon } from "@/lib/HVIcon";
import { InvoiceAlert } from "@/components/Alerts/InvoiceAlert";
import { CheckinRanking } from "@/components/Student/CheckinRanking";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface ClassWithDate {
  class: ClassRow;
  date: Date; // hoje ou amanhã (00:00)
  isToday: boolean;
}

/** Calcula janela de check-in baseada no horário da aula + settings. */
function getCheckinWindow(
  classDate: Date,
  startTime: string,
  opensHoursBefore: number,
  closesHoursBefore: number,
): { opensAt: Date; closesAt: Date } {
  const [h, m] = startTime.split(":").map(Number);
  const classStart = new Date(classDate);
  classStart.setHours(h, m, 0, 0);
  const opensAt = new Date(classStart.getTime() - opensHoursBefore * 3600_000);
  // closes_hours_before é APÓS o início (negativo) — segue padrão lemehub.
  // Aqui interpretamos como: a janela fecha N horas DEPOIS do início.
  const closesAt = new Date(classStart.getTime() + closesHoursBefore * 3600_000);
  return { opensAt, closesAt };
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0min";
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function StudentCheckin() {
  const tenant = useTenant();
  const settings = tenant.settings;
  const { data: student } = useMyStudent();
  const { data: enrolled = [] } = useMyEnrolledClasses(student?.id);
  const { data: todayCheckins = [] } = useTodayCheckins(student?.id);
  const { data: upcomingInvoice = null } = useUpcomingStudentInvoice(student?.id);
  const replacementQ = useReplacementCheckinCount(
    student?.id,
    settings.replacement_period,
    settings.class_replacement_enabled,
  );
  const replacementCount = replacementQ.data ?? 0;
  const createCheckin = useCreateCheckin();
  const deleteCheckin = useDeleteCheckin();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Lista de aulas considerando day_mode
  const visibleClasses = useMemo<ClassWithDate[]>(() => {
    const todayWeekday = now.getDay();
    const tomorrowWeekday = (todayWeekday + 1) % 7;

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayClasses = enrolled
      .filter((c) => c.weekday === todayWeekday)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    const tomorrowClasses = enrolled
      .filter((c) => c.weekday === tomorrowWeekday)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    const mode = settings.checkin_day_mode;
    if (mode === "today_only") {
      return todayClasses.map((c) => ({ class: c, date: today, isToday: true }));
    }
    if (mode === "multi_day") {
      return [
        ...todayClasses.map((c) => ({ class: c, date: today, isToday: true })),
        ...tomorrowClasses.map((c) => ({ class: c, date: tomorrow, isToday: false })),
      ];
    }
    // dynamic: se nada hoje, mostra amanhã.
    if (todayClasses.length > 0) {
      return todayClasses.map((c) => ({ class: c, date: today, isToday: true }));
    }
    return tomorrowClasses.map((c) => ({ class: c, date: tomorrow, isToday: false }));
  }, [enrolled, now, settings.checkin_day_mode]);

  const checkinByClass = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of todayCheckins) map.set(c.class_id, c.id);
    return map;
  }, [todayCheckins]);

  // Status inadimplente
  const tolerance = settings.delinquency_tolerance_days ?? 1;
  const today0 = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  let daysOverdue = 0;
  if (
    upcomingInvoice &&
    (upcomingInvoice.status === "overdue" ||
      (upcomingInvoice.status === "pending" &&
        new Date(upcomingInvoice.due_date) < today0))
  ) {
    daysOverdue = Math.floor(
      (today0.getTime() - new Date(upcomingInvoice.due_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }
  const isDelinquent =
    student?.status === "delinquent" || daysOverdue > tolerance;
  const daysUntilDue = upcomingInvoice
    ? Math.floor(
        (new Date(upcomingInvoice.due_date).getTime() - today0.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <PageScaffold eyebrow="SUA TURMA" title="Check-in">
      {/* Alerta de fatura */}
      <InvoiceAlert
        invoice={upcomingInvoice}
        daysUntilDue={daysUntilDue}
        isOverdue={daysOverdue > 0}
        daysOverdue={daysOverdue}
      />

      {/* Hero ocean */}
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

      {/* Reposições restantes */}
      {settings.class_replacement_enabled && (
        <div className="hv-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-hv-foam grid place-items-center text-hv-navy">
            <HVIcon name="paddle" size={18} stroke={2.2} />
          </div>
          <div className="flex-1">
            <div className="hv-mono text-[10px] tracking-wider font-bold text-hv-text-3">
              REPOSIÇÕES
            </div>
            <div className="text-sm font-semibold">
              {replacementCount} usada{replacementCount === 1 ? "" : "s"} (
              {settings.replacement_period === "calendar" ? "mês" : "ciclo"})
            </div>
          </div>
        </div>
      )}

      {/* Aulas */}
      <div>
        <h3 className="hv-eyebrow mb-2">
          {settings.checkin_day_mode === "multi_day"
            ? "Suas próximas aulas"
            : settings.checkin_day_mode === "today_only"
              ? "Suas aulas de hoje"
              : "Próximas aulas"}
        </h3>
        {visibleClasses.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhuma aula matriculada nesse intervalo.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleClasses.map(({ class: c, date, isToday }) => {
              const checkinId = isToday ? checkinByClass.get(c.id) : undefined;
              const isCheckedIn = !!checkinId;
              const isPending =
                (createCheckin.isPending && createCheckin.variables?.classId === c.id) ||
                (deleteCheckin.isPending && deleteCheckin.variables === checkinId);

              const { opensAt, closesAt } = getCheckinWindow(
                date,
                c.start_time || "00:00",
                settings.checkin_opens_hours_before,
                settings.checkin_closes_hours_before,
              );

              const beforeOpen = now < opensAt;
              const afterClose = now > closesAt;
              const inWindow = !beforeOpen && !afterClose;

              // Pode cancelar se ainda dentro de cancel_hours_before
              const [h, m] = (c.start_time || "00:00").split(":").map(Number);
              const classStart = new Date(date);
              classStart.setHours(h, m, 0, 0);
              const cancelDeadline = new Date(
                classStart.getTime() - settings.cancel_hours_before * 3600_000,
              );
              const canCancel = isCheckedIn && now < cancelDeadline;

              // Estados do botão
              let btn: React.ReactNode;
              if (isCheckedIn) {
                btn = (
                  <button
                    type="button"
                    disabled={isPending || !canCancel}
                    onClick={() => checkinId && deleteCheckin.mutate(checkinId)}
                    className="flex-1 h-10 rounded-[12px] border border-hv-line bg-hv-surface text-foreground text-[13px] font-semibold disabled:opacity-50"
                  >
                    {!canCancel
                      ? `Sem cancelar (faltam ${settings.cancel_hours_before}h)`
                      : isPending
                        ? "Cancelando…"
                        : "Cancelar check-in"}
                  </button>
                );
              } else if (isDelinquent) {
                btn = (
                  <button
                    type="button"
                    disabled
                    className="flex-1 h-10 rounded-[12px] bg-hv-coral/10 text-hv-coral text-[13px] font-bold disabled:opacity-90"
                  >
                    Pague pra fazer check-in
                  </button>
                );
              } else if (beforeOpen) {
                btn = (
                  <button
                    type="button"
                    disabled
                    className="flex-1 h-10 rounded-[12px] bg-hv-bg border border-hv-line text-hv-text-3 text-[13px] font-semibold disabled:opacity-90"
                  >
                    Abre em {fmtCountdown(opensAt.getTime() - now.getTime())}
                  </button>
                );
              } else if (afterClose) {
                btn = (
                  <button
                    type="button"
                    disabled
                    className="flex-1 h-10 rounded-[12px] bg-hv-bg border border-hv-line text-hv-text-3 text-[13px] font-semibold"
                  >
                    Janela encerrada
                  </button>
                );
              } else {
                btn = (
                  <button
                    type="button"
                    disabled={isPending || !student?.id}
                    onClick={() =>
                      student?.id &&
                      createCheckin.mutate({
                        studentId: student.id,
                        classId: c.id,
                      })
                    }
                    className="flex-1 h-10 rounded-[12px] bg-hv-navy text-white text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                  >
                    {isPending ? "Confirmando…" : "Fazer check-in"}
                    {!isPending && <HVIcon name="check" size={14} stroke={2.4} />}
                  </button>
                );
              }

              return (
                <div key={`${c.id}-${date.toISOString()}`} className="hv-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[12px] font-bold w-16">
                      {c.start_time?.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] truncate">
                        {c.venue?.name}
                      </div>
                      <div className="text-[11px] text-hv-text-3 truncate">
                        {isToday ? "Hoje" : "Amanhã"} ·{" "}
                        {c.venue?.address || "Endereço não cadastrado"}
                      </div>
                    </div>
                    {isCheckedIn && (
                      <span className="hv-chip bg-hv-foam text-hv-leaf font-bold flex items-center gap-1">
                        <HVIcon name="check" size={12} color="hsl(var(--hv-leaf))" stroke={2.4} />
                        Confirmado
                      </span>
                    )}
                    {!isCheckedIn && inWindow && !isDelinquent && (
                      <span
                        className="hv-mono text-[10px] tracking-wider font-bold"
                        style={{ color: "hsl(var(--hv-cyan))" }}
                      >
                        ABERTO
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">{btn}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ranking */}
      {settings.checkin_ranking_enabled && <CheckinRanking studentId={student?.id} />}
    </PageScaffold>
  );
}
