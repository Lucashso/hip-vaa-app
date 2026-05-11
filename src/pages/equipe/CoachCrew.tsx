// CoachCrew — visualização real da tripulação OC6 por data.
// - Seletor de data (default hoje se hora<8 senão amanhã)
// - Lista classes ativas do tenant cuja weekday bate
// - Para cada turma, agrupa crew_assignments por boat e mostra 6 assentos
// - Botão "Editar tripulação" (admin/manager/coordinator) → /admin/equipes

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { CrewOrganizer } from "@/components/Crew/CrewOrganizer";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useCrewTemplates } from "@/hooks/useCrew";
import {
  useClassesByDate,
  useCrewAssignmentsForClass,
  type CrewAssignmentForCoach,
} from "@/hooks/useCrew";
import { getInitial } from "@/lib/utils";
import type { CrewTemplate } from "@/hooks/useCrew";

const SEAT_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#F2B544", "#25C7E5", "#7B2D9F"];
const SEAT_ROLES = [
  "Steerer · marcação",
  "Stroker · ritmo",
  "Engine",
  "Engine",
  "Caller · troca",
  "Steerer · timão",
];

function defaultDate(): Date {
  const now = new Date();
  if (now.getHours() < 8) return now;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return tomorrow;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateBR(d: Date): string {
  return d
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();
}

export default function CoachCrew() {
  const { profile } = useAuth();
  const { role } = usePermissions();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(defaultDate);
  const [editTemplate, setEditTemplate] = useState<CrewTemplate | null>(null);

  const tenantId = profile?.tenant_id ?? null;
  const { data: classes = [], isLoading } = useClassesByDate(tenantId, date);
  const { data: templates = [] } = useCrewTemplates(tenantId);

  const canEditCrew = ["owner", "manager", "coordinator"].includes(role ?? "");

  const handleEditCrew = () => {
    // Se há só um template, abre direto; senão vai pra /admin/equipes
    if (templates.length === 1) {
      setEditTemplate(templates[0]);
    } else {
      navigate("/admin/equipes");
    }
  };

  return (
    <PageScaffold
      eyebrow={fmtDateBR(date)}
      title="Tripulação OC6"
      back
      showTabBar={false}
    >
      {/* Date picker */}
      <div className="hv-card p-3 flex items-center gap-3">
        <HVIcon name="calendar" size={18} color="hsl(var(--hv-text-2))" />
        <input
          type="date"
          value={fmtDate(date)}
          onChange={(e) => {
            const parts = e.target.value.split("-").map(Number);
            const [y, m, d] = parts;
            if (y && m && d) setDate(new Date(y, m - 1, d));
          }}
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
        />
        {canEditCrew && (
          <button
            type="button"
            onClick={handleEditCrew}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold border-0"
            style={{
              background: "hsl(var(--hv-navy))",
              color: "white",
            }}
          >
            <HVIcon name="edit" size={13} color="white" />
            Editar
          </button>
        )}
      </div>

      {isLoading ? (
        <Loader />
      ) : classes.length === 0 ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Nenhuma turma neste dia.
        </div>
      ) : (
        classes.map((c) => (
          <ClassCrewCard
            key={c.id}
            classId={c.id}
            date={date}
            title={`${c.start_time.slice(0, 5)} · ${c.venue?.name ?? "—"}`}
            canEdit={canEditCrew}
            templates={templates}
            onEditTemplate={setEditTemplate}
          />
        ))
      )}

      {/* Modal CrewOrganizer inline */}
      <Modal
        open={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title={editTemplate ? `Tripulação · ${editTemplate.name}` : "Tripulação"}
        subtitle="EDITAR ASSENTOS"
        maxWidth={520}
      >
        {editTemplate && (
          <CrewOrganizer
            template={editTemplate}
            tenantId={tenantId}
            onSave={() => setEditTemplate(null)}
          />
        )}
      </Modal>
    </PageScaffold>
  );
}

function ClassCrewCard({
  classId,
  date,
  title,
  canEdit,
  templates,
  onEditTemplate,
}: {
  classId: string;
  date: Date;
  title: string;
  canEdit: boolean;
  templates: CrewTemplate[];
  onEditTemplate: (t: CrewTemplate) => void;
}) {
  const navigate = useNavigate();
  const { data: assignments = [], isLoading } = useCrewAssignmentsForClass(classId, date);

  const boats = useMemo(() => {
    const map = new Map<
      string,
      {
        boat: NonNullable<CrewAssignmentForCoach["boat"]> | null;
        seats: Array<CrewAssignmentForCoach | null>;
      }
    >();
    assignments.forEach((a) => {
      const key = a.boat_id;
      if (!map.has(key)) {
        map.set(key, { boat: a.boat, seats: new Array(6).fill(null) });
      }
      const slot = map.get(key)!;
      const idx = Math.min(5, Math.max(0, a.seat_position - 1));
      slot.seats[idx] = a;
    });
    return Array.from(map.values());
  }, [assignments]);

  const handleEdit = () => {
    if (templates.length === 1) {
      onEditTemplate(templates[0]);
    } else if (templates.length > 1) {
      navigate("/admin/equipes");
    } else {
      navigate("/admin/equipes");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mt-3">
        <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
          {title}
        </h3>
        {canEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1 px-2 py-1 rounded-[7px] text-[10px] font-bold border-0"
            style={{
              background: "hsl(var(--hv-bg))",
              border: "1px solid hsl(var(--hv-line))",
              color: "hsl(var(--hv-text-2))",
            }}
          >
            <HVIcon name="edit" size={11} />
            Editar tripulação
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="hv-card p-4 text-center text-sm text-hv-text-3">Carregando tripulação…</div>
      ) : boats.length === 0 ? (
        <div className="hv-card p-4 text-center text-sm text-hv-text-3">
          Sem tripulação atribuída.
        </div>
      ) : (
        boats.map(({ boat, seats }, bi) => (
          <BoatCard key={boat?.id ?? `b-${bi}`} boat={boat} seats={seats} />
        ))
      )}
    </div>
  );
}

function BoatCard({
  boat,
  seats,
}: {
  boat: NonNullable<CrewAssignmentForCoach["boat"]> | null;
  seats: Array<CrewAssignmentForCoach | null>;
}) {
  return (
    <div
      className="hv-card relative overflow-hidden text-white"
      style={{
        padding: "16px 16px 12px",
        background: "linear-gradient(180deg, #061826, #0E3A5F)",
      }}
    >
      <svg
        viewBox="0 0 320 100"
        className="absolute left-0 right-0 bottom-0 w-full opacity-40 pointer-events-none"
        aria-hidden="true"
      >
        <path d="M0 60 Q80 40 160 60 T320 60 L320 100 L0 100Z" fill="rgba(37,199,229,0.4)" />
        <path d="M0 80 Q80 60 160 80 T320 80 L320 100 L0 100Z" fill="rgba(37,199,229,0.6)" />
      </svg>
      <div
        className="hv-mono text-[10px] tracking-[0.16em] opacity-70 relative"
      >
        {(boat?.name || "OC6").toUpperCase()}
      </div>
      <div className="font-display font-bold text-[16px] mt-0.5 text-white relative">
        {boat?.type ? boat.type.toUpperCase() : "Canoa"}
      </div>

      <div className="mx-auto mt-3 mb-1 relative" style={{ maxWidth: 84 }}>
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
        <div className="relative flex flex-col gap-2 py-[14px]">
          {seats.map((a, i) => {
            const pos = i + 1;
            const name = nameForAssignment(a);
            const color = SEAT_COLORS[i % SEAT_COLORS.length];
            const empty = !a;
            return (
              <div key={pos} className="flex justify-center">
                <div
                  className="relative grid place-items-center font-display font-extrabold text-white text-[14px]"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    background: empty ? "rgba(255,255,255,0.08)" : color,
                    border: "2.5px solid rgba(37,199,229,0.5)",
                  }}
                >
                  {empty ? "—" : getInitial(name)}
                  <span
                    className="hv-mono absolute font-bold"
                    style={{
                      left: -22,
                      top: 12,
                      fontSize: 10,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {pos}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-3 space-y-1.5">
        {seats.map((a, i) => {
          const pos = i + 1;
          const name = nameForAssignment(a);
          const role = SEAT_ROLES[i] ?? "";
          return (
            <div key={pos} className="flex items-center gap-2 text-[12px] text-white/90">
              <span className="hv-mono w-5 text-[10px] opacity-70">{pos}</span>
              <span className="flex-1 font-semibold truncate">{name || "—"}</span>
              <span className="opacity-60 text-[10px] hidden sm:inline">{role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function nameForAssignment(a: CrewAssignmentForCoach | null): string | null {
  if (!a) return null;
  return a.student?.profile?.full_name || a.staff?.full_name || a.guest_name || null;
}
