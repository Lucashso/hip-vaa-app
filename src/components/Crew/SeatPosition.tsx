// SeatPosition — renderiza 1 posição de assento (1-6) com avatar ou "—".
// Usado dentro de BoatCrewCard.

import { getInitial } from "@/lib/utils";

const SEAT_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#F2B544", "#25C7E5", "#7B2D9F"];

export interface SeatStudentInfo {
  id: string;
  full_name: string;
  nickname: string | null;
}

interface SeatPositionProps {
  position: number; // 1-6
  student: SeatStudentInfo | null;
  onClick?: () => void;
  draggable?: boolean;
  isCatamaran?: boolean;
  selected?: boolean;
}

export function SeatPosition({
  position,
  student,
  onClick,
  isCatamaran: _isCatamaran,
  selected = false,
}: SeatPositionProps) {
  const color = SEAT_COLORS[(position - 1) % SEAT_COLORS.length];
  const isEmpty = !student;
  const displayName = student
    ? student.nickname || student.full_name.split(" ")[0]
    : "—";

  return (
    <div
      className="flex flex-col items-center gap-1 select-none"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: isEmpty ? "rgba(255,255,255,0.10)" : color,
          border: selected
            ? "2.5px solid hsl(var(--hv-cyan))"
            : "2.5px solid rgba(37,199,229,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 15,
          color: "white",
          position: "relative",
          boxShadow: selected ? "0 0 0 3px rgba(37,199,229,0.25)" : undefined,
          transition: "box-shadow 0.15s",
        }}
      >
        {isEmpty ? "—" : getInitial(student?.full_name)}
        {/* Número do assento */}
        <span
          style={{
            position: "absolute",
            top: -2,
            left: -16,
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "monospace",
          }}
        >
          {position}
        </span>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: isEmpty ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
          maxWidth: 52,
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
        title={student?.full_name ?? undefined}
      >
        {displayName}
      </div>
    </div>
  );
}
