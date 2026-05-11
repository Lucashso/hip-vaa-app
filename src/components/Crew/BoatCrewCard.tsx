// BoatCrewCard — Silhueta OC6 vertical com 6 SeatPositions empilhados.
// Fundo dark igual ao CoachCrew do lemehub (gradiente #061826 → #0E3A5F).

import { SeatPosition, type SeatStudentInfo } from "./SeatPosition";

export interface BoatSeat {
  position: number; // 1-6
  student: SeatStudentInfo | null;
}

export interface BoatInfo {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface BoatCrewCardProps {
  boat: BoatInfo | null;
  seats: BoatSeat[];
  onSeatClick?: (position: number) => void;
  selectedPosition?: number | null;
}

export function BoatCrewCard({ boat, seats, onSeatClick, selectedPosition }: BoatCrewCardProps) {
  const cap = boat?.capacity ?? 6;

  const seatMap = new Map<number, SeatStudentInfo | null>();
  seats.forEach((s) => seatMap.set(s.position, s.student));

  const allSeats: BoatSeat[] = Array.from({ length: cap }, (_, i) => ({
    position: i + 1,
    student: seatMap.get(i + 1) ?? null,
  }));

  return (
    <div
      className="hv-card relative overflow-hidden text-white"
      style={{
        background: "linear-gradient(180deg, #061826, #0E3A5F)",
        padding: "16px 20px 16px",
      }}
    >
      {/* Ondas decorativas de fundo */}
      <svg
        viewBox="0 0 320 100"
        className="absolute left-0 right-0 bottom-0 w-full opacity-40 pointer-events-none"
        aria-hidden="true"
      >
        <path
          d="M0 60 Q80 40 160 60 T320 60 L320 100 L0 100Z"
          fill="rgba(37,199,229,0.4)"
        />
        <path
          d="M0 80 Q80 60 160 80 T320 80 L320 100 L0 100Z"
          fill="rgba(37,199,229,0.6)"
        />
      </svg>

      {/* Header da canoa */}
      <div className="relative mb-3">
        <div
          className="text-[10px] tracking-[0.16em] opacity-70"
          style={{ fontFamily: "monospace" }}
        >
          {(boat?.name || "OC6").toUpperCase()}
        </div>
        <div
          className="font-bold text-[15px] text-white"
          style={{ fontFamily: "var(--font-display, system-ui)" }}
        >
          {boat?.type ? boat.type.toUpperCase() : "Canoa"} · {cap} lugares
        </div>
      </div>

      {/* Silhueta OC6 + seats empilhados */}
      <div className="relative mx-auto" style={{ maxWidth: 84 }}>
        {/* SVG silhueta canoa */}
        <svg
          viewBox="0 0 84 360"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
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

        {/* Seats empilhados */}
        <div
          className="relative flex flex-col items-center"
          style={{ gap: 8, paddingTop: 14, paddingBottom: 14 }}
        >
          {allSeats.map((s) => (
            <SeatPosition
              key={s.position}
              position={s.position}
              student={s.student}
              onClick={onSeatClick ? () => onSeatClick(s.position) : undefined}
              selected={selectedPosition === s.position}
            />
          ))}
        </div>
      </div>

      {/* Lista lateral de assentos */}
      <div className="relative mt-4 space-y-1.5">
        {allSeats.map((s) => (
          <div
            key={s.position}
            className="flex items-center gap-2 text-[12px] text-white/90"
          >
            <span
              style={{
                width: 18,
                fontSize: 10,
                fontFamily: "monospace",
                opacity: 0.7,
                flexShrink: 0,
              }}
            >
              {s.position}
            </span>
            <span className="flex-1 font-semibold truncate">
              {s.student
                ? s.student.nickname || s.student.full_name
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
