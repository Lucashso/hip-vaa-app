// AvulsoAgendado — calendário simples + lista de aulas disponíveis.
// Recebe `dropInStudentId` via location.state (vindo do AvulsoGratuito).
// Click numa aula → chama edge `schedule-drop-in`, mostra confirmação.
// Rotas: /avulso/agendado e /:slug/avulso/agendado

import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useTenantBySlug } from "@/hooks/useTenantBySlug";
import {
  useUpcomingDropInClasses,
  type DropInDaySlot,
} from "@/hooks/useDropInClasses";
import { useScheduleDropIn } from "@/hooks/useDropInSignup";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavState {
  dropInStudentId?: string;
  tenantId?: string;
  tenantName?: string;
  slug?: string;
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = WEEKDAY_SHORT[dt.getDay()];
  return `${weekday}, ${d} de ${MONTH_SHORT[dt.getMonth()]}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function trimTime(t: string): string {
  // "HH:MM:SS" -> "HH:MM"
  return t?.slice(0, 5) ?? "";
}

interface ConfirmedInfo {
  date: string;
  className: string;
  venueName: string;
  startTime: string;
  endTime: string;
}

export default function AvulsoAgendado() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  const state = (location.state ?? {}) as NavState;
  const dropInStudentId = state.dropInStudentId;
  const tenantIdFromState = state.tenantId;

  // Fallback: se o user recarregou a tela e perdeu o state, redireciona pra avulso/gratuito.
  // (Não dá pra agendar sem o ID do drop-in.)
  const { data: tenant, isLoading: tenantLoading } = useTenantBySlug(slug);

  const tenantId = tenantIdFromState ?? tenant?.id ?? null;
  const dateFrom = useMemo(() => todayStr(), []);
  const { data: days = [], isLoading: classesLoading } = useUpcomingDropInClasses(tenantId, dateFrom);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedInfo | null>(null);

  const schedule = useScheduleDropIn();

  // Se nem state nem slug existe, redireciona pro form grátis.
  if (!dropInStudentId) {
    const target = slug ? `/${slug}/avulso/gratuito` : "/avulso/gratuito";
    return <Navigate to={target} replace />;
  }

  if (tenantLoading) return <Loader />;

  const selectedDay: DropInDaySlot | undefined = days.find((d) => d.date === selectedDate);

  const handleSchedule = async (cls: NonNullable<DropInDaySlot["classes"]>[number], dateStr: string) => {
    try {
      await schedule.mutateAsync({
        drop_in_student_id: dropInStudentId,
        class_id: cls.class_id,
        scheduled_date: dateStr,
      });
      setConfirmed({
        date: dateStr,
        className: `${trimTime(cls.start_time)} – ${trimTime(cls.end_time)}`,
        venueName: cls.venue?.name ?? "Local",
        startTime: trimTime(cls.start_time),
        endTime: trimTime(cls.end_time),
      });
      toast.success("Aula agendada!");
    } catch {
      // toast já é tratado no hook
    }
  };

  if (confirmed) {
    const longDate = formatDateLong(confirmed.date);
    // Conteúdo do "Adicionar ao calendário": gera arquivo .ics simples.
    const handleAddToCalendar = () => {
      const [y, m, d] = confirmed.date.split("-").map(Number);
      const [sh, sm] = confirmed.startTime.split(":").map(Number);
      const [eh, em] = confirmed.endTime.split(":").map(Number);
      const startUtc = new Date(y, m - 1, d, sh ?? 8, sm ?? 0);
      const endUtc = new Date(y, m - 1, d, eh ?? 9, em ?? 0);
      const fmt = (dt: Date) =>
        `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth() + 1)}${pad2(dt.getUTCDate())}T${pad2(dt.getUTCHours())}${pad2(dt.getUTCMinutes())}00Z`;
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hip Vaa//Avulso//PT-BR",
        "BEGIN:VEVENT",
        `UID:${dropInStudentId}@hip-vaa`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(startUtc)}`,
        `DTEND:${fmt(endUtc)}`,
        `SUMMARY:Aula avulsa · ${tenant?.name ?? ""}`,
        `LOCATION:${confirmed.venueName}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aula-hip-vaa.ics";
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-5">
          <HVIcon name="check" size={42} color="hsl(var(--hv-leaf))" stroke={2.4} />
        </div>
        <h1 className="font-display text-[28px] text-hv-navy">Aula agendada!</h1>
        <p className="text-[14px] text-hv-text-2 mt-2 max-w-[320px]">
          Caso haja algum imprevisto, a equipe entra em contato.
        </p>

        <div className="mt-5 w-full max-w-sm hv-card p-4 text-left">
          <div className="flex items-center gap-2.5 mb-2">
            <HVIcon name="calendar" size={16} color="hsl(var(--hv-navy))" />
            <span className="text-sm font-bold capitalize">{longDate}</span>
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <HVIcon name="calendar" size={16} color="hsl(var(--hv-navy))" />
            <span className="text-sm">
              {confirmed.startTime} – {confirmed.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <HVIcon name="pin" size={16} color="hsl(var(--hv-navy))" />
            <span className="text-sm">{confirmed.venueName}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCalendar}
          className="mt-5 h-12 px-6 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center gap-2 active:scale-[0.97] transition-transform"
        >
          <HVIcon name="calendar" size={16} stroke={2.4} />
          Adicionar ao calendário
        </button>
        <button
          type="button"
          onClick={() => navigate("/auth", { replace: true })}
          className="mt-3 h-11 px-5 rounded-[12px] text-hv-navy text-sm font-semibold"
        >
          Voltar pro início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-4 pb-1.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <div className="hv-mono flex-1 text-[10px] text-hv-text-3 tracking-[0.16em]">
          AGENDAR AULA
        </div>
        {tenant?.name && <span className="hv-chip capitalize">{tenant.name}</span>}
      </div>

      <div className="px-5 mt-2">
        <h1 className="font-display text-[26px] leading-[1.05]">Escolha sua aula</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5 leading-[1.5]">
          Próximos 7 dias. Toque numa data e selecione a aula com vagas.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-6">
        {classesLoading ? (
          <div className="py-10 grid place-items-center">
            <Loader />
          </div>
        ) : (
          <>
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {days.map((day) => {
                const [, , dd] = day.date.split("-").map(Number);
                const wd = WEEKDAY_SHORT[day.weekday];
                const isActive = selectedDate === day.date;
                const hasClasses = day.classes.length > 0;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-[12px] border-[1.5px] transition-colors",
                      isActive
                        ? "border-hv-navy bg-hv-foam text-hv-navy"
                        : hasClasses
                          ? "border-hv-line bg-hv-surface text-foreground hover:border-hv-navy/40"
                          : "border-hv-line bg-hv-surface text-hv-text-3 opacity-50",
                    )}
                    disabled={!hasClasses}
                  >
                    <span className="text-[10px] uppercase font-semibold tracking-wider">{wd}</span>
                    <span className="text-xl font-bold leading-tight">{dd}</span>
                    <span className="text-[9px] uppercase tracking-wide">
                      {hasClasses ? `${day.classes.length} aulas` : "sem aulas"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Aulas do dia selecionado */}
            {!selectedDate ? (
              <div className="hv-card p-4 mt-5 text-center text-sm text-hv-text-2">
                Selecione uma data acima.
              </div>
            ) : selectedDay && selectedDay.classes.length === 0 ? (
              <div className="hv-card p-4 mt-5 text-center text-sm text-hv-text-2">
                Não há aulas com vagas neste dia.
              </div>
            ) : (
              <div className="mt-5 space-y-2.5">
                <div className="text-[12px] text-hv-text-2 capitalize">
                  Aulas em {selectedDay ? formatDateLong(selectedDay.date) : ""}
                </div>
                {selectedDay?.classes.map((cls) => (
                  <button
                    key={cls.class_id}
                    type="button"
                    disabled={schedule.isPending}
                    onClick={() => handleSchedule(cls, selectedDay.date)}
                    className="w-full text-left p-3.5 rounded-[14px] border border-hv-line bg-hv-surface flex items-center gap-3 active:scale-[0.99] transition disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-hv-foam grid place-items-center shrink-0">
                      <HVIcon name="calendar" size={18} color="hsl(var(--hv-navy))" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">
                        {trimTime(cls.start_time)} – {trimTime(cls.end_time)}
                      </div>
                      <div className="text-[12px] text-hv-text-3 mt-0.5 truncate">
                        {cls.venue?.name ?? "Local"}
                        {cls.max_capacity != null
                          ? ` · ${cls.available} vaga${cls.available === 1 ? "" : "s"}`
                          : ""}
                      </div>
                    </div>
                    <HVIcon name="arrow-right" size={16} color="hsl(var(--hv-navy))" stroke={2.4} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
