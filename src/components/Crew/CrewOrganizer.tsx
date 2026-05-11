// CrewOrganizer — Editor visual de tripulação.
// Tap em seat → modal "Trocar aluno" com lista para selecionar.
// Botão "Salvar tripulação" → useSaveCrewSeats.

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import {
  useCrewTemplateSeats,
  useSaveCrewSeats,
  useTenantStudents,
  type CrewTemplate,
} from "@/hooks/useCrew";
import { BoatCrewCard, type BoatSeat } from "./BoatCrewCard";
import type { SeatStudentInfo } from "./SeatPosition";

interface CrewOrganizerProps {
  template: CrewTemplate;
  tenantId: string | null;
  onSave?: () => void;
}

export function CrewOrganizer({ template, tenantId, onSave }: CrewOrganizerProps) {
  const cap = template.boat?.capacity ?? 6;

  const { data: existingSeats = [], isLoading: loadingSeats } = useCrewTemplateSeats(template.id);
  const { data: allStudents = [], isLoading: loadingStudents } = useTenantStudents(tenantId);
  const saveMut = useSaveCrewSeats();

  // picks[i] = student_id ou null para o assento i+1
  const [picks, setPicks] = useState<(string | null)[]>(() => Array(cap).fill(null));
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);

  // Inicializa picks com os assentos existentes
  useEffect(() => {
    if (loadingSeats) return;
    const arr: (string | null)[] = Array(cap).fill(null);
    existingSeats.forEach((s) => {
      if (s.seat_position >= 1 && s.seat_position <= cap) {
        arr[s.seat_position - 1] = s.student_id;
      }
    });
    setPicks(arr);
  }, [template.id, existingSeats, cap, loadingSeats]);

  const studentMap = new Map<string, SeatStudentInfo>(
    allStudents.map((s) => [s.id, { id: s.id, full_name: s.full_name, nickname: s.nickname }])
  );

  // Alunos já usados em outros assentos (para sinalizar duplicidade, mas não bloquear)
  const usedStudentIds = new Set(picks.filter(Boolean) as string[]);

  const seats: BoatSeat[] = Array.from({ length: cap }, (_, i) => ({
    position: i + 1,
    student: picks[i] ? (studentMap.get(picks[i]!) ?? null) : null,
  }));

  const handleSeatClick = (pos: number) => {
    setSelectedPos(pos);
    setSeatModalOpen(true);
  };

  const handleSelectStudent = (studentId: string | null) => {
    if (selectedPos == null) return;
    const next = [...picks];
    next[selectedPos - 1] = studentId;
    setPicks(next);
    setSeatModalOpen(false);
    setSelectedPos(null);
  };

  const handleSave = () => {
    saveMut.mutate(
      {
        templateId: template.id,
        seats: picks.map((sid, i) => ({ seat_position: i + 1, student_id: sid })),
      },
      { onSuccess: () => onSave?.() }
    );
  };

  if (loadingSeats || loadingStudents) {
    return <Loader />;
  }

  const selectedStudentId = selectedPos != null ? picks[selectedPos - 1] : null;

  // Alunos não atribuídos (em qualquer seat) para aparecer em destaque
  const unassignedStudents = allStudents.filter((s) => !usedStudentIds.has(s.id));
  const assignedStudents = allStudents.filter((s) => usedStudentIds.has(s.id));

  return (
    <div className="space-y-4">
      {/* Instrução */}
      <div
        className="text-[12px] text-hv-text-3 px-1 flex items-center gap-1.5"
      >
        <HVIcon name="paddle" size={14} color="hsl(var(--hv-text-3))" />
        Toque em um assento para trocar o atleta
      </div>

      {/* Canoa + seats */}
      <BoatCrewCard
        boat={template.boat ?? null}
        seats={seats}
        onSeatClick={handleSeatClick}
        selectedPosition={selectedPos}
      />

      {/* Alunos não-atribuídos */}
      {unassignedStudents.length > 0 && (
        <div>
          <div className="hv-eyebrow text-[11px] text-hv-text-3 mb-1.5">
            Disponíveis ({unassignedStudents.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unassignedStudents.map((s) => (
              <div
                key={s.id}
                className="hv-chip text-[11px] font-semibold"
                style={{ cursor: "default" }}
              >
                {s.nickname || s.full_name.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão salvar */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saveMut.isPending}
        className="w-full py-2.5 rounded-[10px] text-[13px] font-bold text-white border-0"
        style={{
          background: "hsl(var(--hv-navy))",
          opacity: saveMut.isPending ? 0.7 : 1,
        }}
      >
        {saveMut.isPending ? "Salvando..." : "Salvar tripulação"}
      </button>

      {/* Modal de seleção de aluno */}
      <Modal
        open={seatModalOpen}
        onClose={() => { setSeatModalOpen(false); setSelectedPos(null); }}
        title={`Assento ${selectedPos ?? ""}`}
        subtitle="TROCAR ATLETA"
        maxWidth={420}
      >
        <div className="space-y-1">
          {/* Opção vazio */}
          <button
            type="button"
            onClick={() => handleSelectStudent(null)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left text-[13px] font-semibold text-hv-text-2 border-0"
            style={{
              background: selectedStudentId === null ? "hsl(var(--hv-bg))" : "transparent",
              border: "1px solid hsl(var(--hv-line))",
            }}
          >
            <div
              className="w-8 h-8 rounded-full grid place-items-center shrink-0"
              style={{ background: "hsl(var(--hv-line))" }}
            >
              <HVIcon name="x" size={14} color="hsl(var(--hv-text-3))" />
            </div>
            <span className="text-hv-text-3">— Vazio —</span>
          </button>

          {/* Alunos disponíveis primeiro */}
          {unassignedStudents.length > 0 && (
            <div
              className="text-[10px] font-semibold text-hv-text-3 pt-2 pb-0.5 px-1 uppercase tracking-wider"
            >
              Disponíveis
            </div>
          )}
          {unassignedStudents.map((s) => (
            <StudentOption
              key={s.id}
              id={s.id}
              fullName={s.full_name}
              nickname={s.nickname}
              selected={selectedStudentId === s.id}
              onSelect={() => handleSelectStudent(s.id)}
            />
          ))}

          {/* Alunos já atribuídos (em outros assentos) */}
          {assignedStudents.length > 0 && (
            <div
              className="text-[10px] font-semibold text-hv-text-3 pt-2 pb-0.5 px-1 uppercase tracking-wider"
            >
              Já atribuídos
            </div>
          )}
          {assignedStudents.map((s) => (
            <StudentOption
              key={s.id}
              id={s.id}
              fullName={s.full_name}
              nickname={s.nickname}
              selected={selectedStudentId === s.id}
              onSelect={() => handleSelectStudent(s.id)}
              dimmed
            />
          ))}
        </div>
      </Modal>
    </div>
  );
}

function StudentOption({
  id,
  fullName,
  nickname,
  selected,
  onSelect,
  dimmed = false,
}: {
  id: string;
  fullName: string;
  nickname: string | null;
  selected: boolean;
  onSelect: () => void;
  dimmed?: boolean;
}) {
  const initials = fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-left border-0"
      style={{
        background: selected ? "hsl(var(--hv-navy) / 0.12)" : "transparent",
        border: selected ? "1px solid hsl(var(--hv-navy))" : "1px solid hsl(var(--hv-line))",
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-full grid place-items-center shrink-0 text-white text-[11px] font-bold"
        style={{ background: selected ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-3))" }}
      >
        {initials || "?"}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-hv-text truncate">
          {nickname ? `${nickname}` : fullName.split(" ")[0]}
        </div>
        {nickname && (
          <div className="text-[10px] text-hv-text-3 truncate">{fullName}</div>
        )}
      </div>
      {selected && (
        <div className="ml-auto shrink-0">
          <HVIcon name="check" size={15} color="hsl(var(--hv-navy))" stroke={2.5} />
        </div>
      )}
    </button>
  );
}
