// HeartRateZones — tabela simples 5 zonas com faixa FC + % FCmax + descrição.
// Útil em ResultadoTreino quando há teste de corrida (runningTest).

interface HeartRateZonesProps {
  /** Frequência cardíaca máxima do atleta. Padrão: 190 bpm. */
  maxHR?: number;
  /** Classe CSS extra no container externo. */
  className?: string;
}

interface Zone {
  id: string;
  label: string;
  pctMin: number;
  pctMax: number;
  description: string;
  color: string;
}

const ZONES: Zone[] = [
  {
    id: "Z1",
    label: "Z1",
    pctMin: 50,
    pctMax: 60,
    description: "Recuperação ativa",
    color: "#4ade80", // green
  },
  {
    id: "Z2",
    label: "Z2",
    pctMin: 60,
    pctMax: 70,
    description: "Base aeróbica",
    color: "#86efac",
  },
  {
    id: "Z3",
    label: "Z3",
    pctMin: 70,
    pctMax: 80,
    description: "Resistência aeróbica",
    color: "#fbbf24", // amber
  },
  {
    id: "Z4",
    label: "Z4",
    pctMin: 80,
    pctMax: 90,
    description: "Limiar anaeróbico",
    color: "#fb923c", // orange
  },
  {
    id: "Z5",
    label: "Z5",
    pctMin: 90,
    pctMax: 100,
    description: "VO2 máx / Sprint",
    color: "#f87171", // red
  },
];

export function HeartRateZones({ maxHR = 190, className }: HeartRateZonesProps) {
  return (
    <div className={className}>
      <div
        className="hv-mono"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "hsl(var(--hv-text-3))",
          marginBottom: 8,
        }}
      >
        ZONAS DE FC
      </div>
      <div className="hv-card overflow-hidden p-0">
        {ZONES.map((z, i) => {
          const bpmMin = Math.round((z.pctMin / 100) * maxHR);
          const bpmMax = Math.round((z.pctMax / 100) * maxHR);
          return (
            <div
              key={z.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                borderBottom: i < ZONES.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
              }}
            >
              {/* Zone color dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: z.color,
                  flexShrink: 0,
                }}
              />
              {/* Label */}
              <div
                className="hv-mono"
                style={{ fontSize: 11, fontWeight: 700, width: 22, flexShrink: 0 }}
              >
                {z.label}
              </div>
              {/* BPM range */}
              <div style={{ fontSize: 12, fontWeight: 600, width: 80, flexShrink: 0 }}>
                {bpmMin}–{bpmMax} bpm
              </div>
              {/* Pct */}
              <div
                style={{
                  fontSize: 11,
                  color: "hsl(var(--hv-text-3))",
                  width: 60,
                  flexShrink: 0,
                }}
              >
                {z.pctMin}–{z.pctMax}%
              </div>
              {/* Description */}
              <div
                style={{
                  fontSize: 11,
                  color: "hsl(var(--hv-text-2))",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {z.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HeartRateZones;
