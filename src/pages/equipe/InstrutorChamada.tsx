// InstrutorChamada — chamada ao vivo wireada com dados reais.
// Stats + busca + lista de presença (matrículas) + check-in inline + avulso.

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import {
  useClassEnrollments,
  useClassCheckinsToday,
  useCreateCheckin,
  useCreateGuestCheckin,
  useDeleteCheckin,
  useClassInfo,
  type CheckinRow,
} from "@/hooks/useChamada";
import { cn, getInitial } from "@/lib/utils";

type Status = "presente" | "atraso" | "ausente";

interface StatusStyle {
  bg: string;
  fg: string;
  icon: HVIconName;
  label: string;
}

const STATUS_STYLE: Record<Status, StatusStyle> = {
  presente: { bg: "rgba(47,179,122,0.12)", fg: "hsl(var(--hv-leaf))", icon: "check", label: "Presente" },
  atraso: { bg: "rgba(242,181,68,0.18)", fg: "hsl(var(--hv-amber))", icon: "wave", label: "Atraso" },
  ausente: { bg: "hsl(var(--hv-bg))", fg: "hsl(var(--hv-text-3))", icon: "x", label: "Falta" },
};

const SEAT_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#F2B544", "#25C7E5", "#7B2D9F", "#0E3A5F", "#8395A4"];

function colorFromId(id: string): string {
  // simple hash
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return SEAT_COLORS[Math.abs(h) % SEAT_COLORS.length];
}

function parseStartTime(startTime: string | null | undefined): { h: number; m: number } | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(":").map((p) => Number(p));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { h, m };
}

function isLate(checkinTs: string, classStart: string | null | undefined): boolean {
  const parsed = parseStartTime(classStart);
  if (!parsed) return false;
  const dt = new Date(checkinTs);
  const start = new Date(dt);
  start.setHours(parsed.h, parsed.m + 5, 0, 0);
  return dt.getTime() > start.getTime();
}

export default function InstrutorChamada() {
  const { classId } = useParams<{ classId: string }>();
  const [search, setSearch] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState("");

  const { data: classInfo } = useClassInfo(classId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useClassEnrollments(classId);
  const { data: checkins = [] } = useClassCheckinsToday(classId);
  const createCheckin = useCreateCheckin();
  const createGuest = useCreateGuestCheckin();
  const deleteCheckin = useDeleteCheckin();

  // map student_id -> checkin
  const checkinByStudent = useMemo(() => {
    const map = new Map<string, CheckinRow>();
    checkins.forEach((c) => {
      if (c.student_id) map.set(c.student_id, c);
    });
    return map;
  }, [checkins]);

  const guestCheckins = useMemo(
    () => checkins.filter((c) => !c.student_id && c.guest_name),
    [checkins],
  );

  const rows = useMemo(() => {
    type Row = {
      key: string;
      kind: "student" | "guest";
      studentId?: string;
      checkinId?: string;
      name: string;
      photo: string | null;
      status: Status;
      timeStr: string | null;
      color: string;
    };
    const term = search.trim().toLowerCase();
    const list: Row[] = [];

    enrollments.forEach((e) => {
      if (!e.student) return;
      const profile = e.student.profile;
      const name = profile?.full_name || "Aluno";
      if (term && !name.toLowerCase().includes(term)) return;
      const c = checkinByStudent.get(e.student.id);
      let status: Status = "ausente";
      let timeStr: string | null = null;
      if (c) {
        const late = isLate(c.ts, classInfo?.start_time);
        status = late ? "atraso" : "presente";
        const d = new Date(c.ts);
        timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
      list.push({
        key: `s-${e.student.id}`,
        kind: "student",
        studentId: e.student.id,
        checkinId: c?.id,
        name,
        photo: profile?.photo_url ?? null,
        status,
        timeStr,
        color: colorFromId(e.student.id),
      });
    });

    guestCheckins.forEach((c) => {
      const name = c.guest_name || "Convidado";
      if (term && !name.toLowerCase().includes(term)) return;
      const late = isLate(c.ts, classInfo?.start_time);
      const d = new Date(c.ts);
      list.push({
        key: `g-${c.id}`,
        kind: "guest",
        checkinId: c.id,
        name,
        photo: null,
        status: late ? "atraso" : "presente",
        timeStr: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        color: colorFromId(c.id),
      });
    });

    return list;
  }, [enrollments, checkinByStudent, guestCheckins, search, classInfo?.start_time]);

  const presentes = rows.filter((r) => r.status === "presente").length;
  const atrasos = rows.filter((r) => r.status === "atraso").length;
  const totalEnrolled = enrollments.length;
  const totalPresent = presentes + atrasos;
  const faltam = Math.max(0, totalEnrolled - totalPresent);
  const totalCount = totalEnrolled + guestCheckins.length;

  const stats = [
    { value: presentes, label: "Presentes", color: "hsl(var(--hv-leaf))" },
    { value: atrasos, label: "Atraso", color: "hsl(var(--hv-amber))" },
    { value: faltam, label: "Faltam", color: "hsl(var(--hv-coral))" },
    { value: totalCount, label: "Total", color: "hsl(var(--hv-text-2))" },
  ];

  const handleToggle = (row: (typeof rows)[number]) => {
    if (!classId) return;
    if (row.status === "ausente" && row.studentId) {
      createCheckin.mutate(
        { studentId: row.studentId, classId },
        {
          onSuccess: () => toast.success(`${row.name} marcado presente`),
          onError: (err: Error) => toast.error(err.message || "Erro ao registrar check-in"),
        },
      );
    } else if (row.checkinId) {
      deleteCheckin.mutate(
        { checkinId: row.checkinId, classId },
        {
          onSuccess: () => toast.success(`${row.name} desmarcado`),
          onError: (err: Error) => toast.error(err.message || "Erro ao remover check-in"),
        },
      );
    }
  };

  const handleAddGuest = () => {
    if (!classId || !guestName.trim()) return;
    createGuest.mutate(
      { guestName: guestName.trim(), classId },
      {
        onSuccess: () => {
          toast.success(`${guestName.trim()} adicionado`);
          setGuestName("");
          setShowGuestModal(false);
        },
        onError: (err: Error) => toast.error(err.message || "Erro ao adicionar avulso"),
      },
    );
  };

  return (
    <PageScaffold
      eyebrow="CHAMADA AO VIVO"
      title="Presença"
      back
      showTabBar={false}
      trailing={
        <button
          type="button"
          onClick={() => setShowGuestModal(true)}
          className="px-3 py-2 rounded-[10px] bg-hv-navy text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <HVIcon name="plus" size={14} stroke={2.4} color="white" />
          Avulso
        </button>
      }
    >
      {/* Stats card */}
      <div className="hv-card p-3.5 flex gap-2.5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex-1 text-center",
              i < stats.length - 1 && "border-r border-hv-line",
            )}
          >
            <div
              className="font-display font-extrabold text-[24px] leading-none"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-hv-text-3 uppercase tracking-wider font-semibold mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-11 px-3.5 rounded-[12px] bg-hv-surface border border-hv-line flex items-center gap-2">
          <HVIcon name="search" size={16} color="hsl(var(--hv-text-3))" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno…"
            className="flex-1 bg-transparent text-[13px] placeholder:text-hv-text-3 focus:outline-none"
          />
        </div>
      </div>

      {/* Lista de alunos */}
      {loadingEnrollments ? (
        <div className="hv-card p-6 text-center text-hv-text-3 text-sm">Carregando matrículas…</div>
      ) : rows.length === 0 ? (
        <div className="hv-card p-6 text-center text-hv-text-3 text-sm">
          {totalEnrolled === 0
            ? "Nenhum aluno matriculado nesta turma."
            : "Nenhum aluno encontrado."}
        </div>
      ) : (
        <div className="hv-card overflow-hidden">
          {rows.map((r, i) => {
            const style = STATUS_STYLE[r.status];
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleToggle(r)}
                disabled={r.kind === "guest" && r.status !== "ausente" ? false : false}
                className={cn(
                  "w-full text-left flex items-center gap-3 px-3.5 py-3",
                  i < rows.length - 1 && "border-b border-hv-line",
                  r.status === "presente" && "bg-[rgba(47,179,122,0.04)]",
                )}
              >
                <div
                  className="relative w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0 overflow-hidden"
                  style={{ background: r.color }}
                >
                  {r.photo ? (
                    <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitial(r.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{r.name}</div>
                  <div className="font-mono text-[10px] text-hv-text-3 tracking-wider">
                    {r.kind === "guest" ? "AVULSO" : "MATRICULADO"}
                    {r.timeStr && ` · ${r.timeStr}`}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
                  style={{ background: style.bg, color: style.fg }}
                >
                  <HVIcon name={style.icon} size={12} stroke={2.6} />
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Avulso modal */}
      {showGuestModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setShowGuestModal(false)}
        >
          <div
            className="hv-card p-5 max-w-sm w-full bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-[18px] mb-1">Adicionar avulso</div>
            <div className="text-sm text-hv-text-2 mb-4">
              Marca presença de alguém que não é aluno matriculado.
            </div>
            <label className="hv-mono text-[10px] text-hv-text-3 tracking-[1px] mb-1.5 block">
              NOME DO CONVIDADO
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nome completo"
              className="w-full h-11 rounded-[12px] border border-hv-line bg-background px-3 text-sm focus-visible:outline-none focus-visible:border-hv-navy"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="flex-1 py-3 rounded-[12px] border border-hv-line text-hv-text-2 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddGuest}
                disabled={!guestName.trim() || createGuest.isPending}
                className="flex-1 py-3 rounded-[12px] bg-hv-cyan text-hv-ink font-bold text-sm disabled:opacity-50"
              >
                {createGuest.isPending ? "Salvando…" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
