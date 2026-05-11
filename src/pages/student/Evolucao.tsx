// Minha Evolução — gráfico frequência + stats + avaliações físicas + treinos completados.

import { useMemo } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useMyStudent } from "@/hooks/useStudent";
import { useMyAssessments } from "@/hooks/useMyAssessments";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useStravaConnection, useStravaConnect, useStravaDisconnect } from "@/hooks/useStrava";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface CheckinByMonth {
  monthKey: string;
  label: string;
  count: number;
}

function useLast90DaysCheckins(studentId?: string) {
  return useQuery({
    queryKey: ["evolucao-90d", studentId],
    queryFn: async (): Promise<{ total: number; streakMax: number; months: CheckinByMonth[] }> => {
      if (!studentId) return { total: 0, streakMax: 0, months: [] };
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await supabase
        .from("checkins")
        .select("ts")
        .eq("student_id", studentId)
        .gte("ts", since.toISOString())
        .order("ts", { ascending: true });
      if (error) throw error;

      const rows = (data as { ts: string }[]) ?? [];
      const total = rows.length;

      // streak (consecutive days)
      const dayKeys = Array.from(
        new Set(rows.map((r) => new Date(r.ts).toISOString().slice(0, 10))),
      ).sort();
      let streakMax = 0;
      let cur = 0;
      let prev: Date | null = null;
      for (const k of dayKeys) {
        const d = new Date(k);
        if (prev) {
          const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
          if (diff === 1) cur += 1;
          else cur = 1;
        } else cur = 1;
        if (cur > streakMax) streakMax = cur;
        prev = d;
      }

      // bucketize by month
      const monthCounts = new Map<string, number>();
      const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      for (const r of rows) {
        const d = new Date(r.ts);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
      }
      // last 4 months from today
      const months: CheckinByMonth[] = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months.push({
          monthKey: key,
          label: monthNames[d.getMonth()],
          count: monthCounts.get(key) ?? 0,
        });
      }
      return { total, streakMax, months };
    },
    enabled: !!studentId,
  });
}

const MONTHS_BR_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatAssessmentDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS_BR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_BR_SHORT[d.getMonth()]}`;
}

export default function StudentEvolucao() {
  const { profile } = useAuth();
  const { data: student } = useMyStudent();
  const { data: stats } = useLast90DaysCheckins(student?.id);
  const { data: assessments = [] } = useMyAssessments(student?.id);
  const { data: sessions = [] } = useTrainingSessions(student?.id);
  const { data: stravaConn } = useStravaConnection(profile?.id);
  const stravaConnect = useStravaConnect();
  const stravaDisconnect = useStravaDisconnect();

  // chart points
  const chartPoints = useMemo(() => {
    const months = stats?.months ?? [
      { monthKey: "0", label: "FEV", count: 0 },
      { monthKey: "1", label: "MAR", count: 0 },
      { monthKey: "2", label: "ABR", count: 0 },
      { monthKey: "3", label: "MAI", count: 0 },
    ];
    const max = Math.max(...months.map((m) => m.count), 1);
    const W = 340;
    const H = 110;
    const stepX = W / Math.max(months.length - 1, 1);
    return months.map((m, i) => ({
      x: i * stepX,
      y: H - 20 - (m.count / max) * 60,
      label: m.label,
    }));
  }, [stats]);

  const pathArea = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const pts = chartPoints.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `M${first.x} ${first.y} L ${pts} L ${last.x} 110 L ${first.x} 110 Z`;
  }, [chartPoints]);

  const pathLine = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return "M" + chartPoints.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
  }, [chartPoints]);

  // frequency % — approximation: checkins relative to ideal of 12 per month
  const frequencyPct = useMemo(() => {
    if (!stats || stats.months.length === 0) return 0;
    const ideal = 12 * stats.months.length;
    const got = stats.months.reduce((s, m) => s + m.count, 0);
    return Math.min(100, Math.round((got / ideal) * 100));
  }, [stats]);

  const firstName = (profile?.full_name || "Você").split(" ")[0].toUpperCase();
  const totalAulas = stats?.total ?? 0;
  const horasAgua = Math.round(totalAulas * 1.25);
  const kmRemados = Math.round(totalAulas * 2.2);
  const calorias = Math.round(totalAulas * 560);

  const statCards: Array<{
    label: string;
    value: string;
    detail: string;
    color: string;
    icon: Parameters<typeof HVIcon>[0]["name"];
  }> = [
    { label: "AULAS TOTAIS", value: String(totalAulas), detail: "últimos 90 dias", color: "hsl(var(--hv-navy))", icon: "calendar" },
    { label: "KM REMADOS", value: String(kmRemados), detail: `≈ ${Math.max(1, Math.round(kmRemados / 30))} maratonas`, color: "hsl(var(--hv-blue))", icon: "wave" },
    { label: "HORAS NA ÁGUA", value: `${horasAgua}h`, detail: "média 1h15/sessão", color: "hsl(var(--hv-cyan))", icon: "boat" },
    { label: "CALORIAS", value: calorias >= 1000 ? `${Math.round(calorias / 1000)}k` : String(calorias), detail: "estimado", color: "hsl(var(--hv-coral))", icon: "zap" },
  ];

  return (
    <PageScaffold
      eyebrow={`${firstName} · ÚLTIMOS 90 DIAS`}
      title="Minha Evolução"
    >
      {/* Card Strava */}
      {stravaConn ? (
        <div
          className="hv-card p-3.5 flex items-center gap-3"
          style={{ borderLeft: "3px solid hsl(var(--hv-coral))" }}
        >
          <div
            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
            style={{ background: "hsl(var(--hv-coral) / 0.12)" }}
          >
            <HVIcon name="zap" size={18} color="hsl(var(--hv-coral))" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px]">Strava conectado</div>
            <div className="text-[11px] text-hv-text-3 truncate">
              {stravaConn.athlete_name || "Atleta"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => profile?.id && stravaDisconnect.mutate(profile.id)}
            disabled={stravaDisconnect.isPending}
            className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold border-0"
            style={{
              background: "hsl(var(--hv-coral) / 0.12)",
              color: "hsl(var(--hv-coral))",
              opacity: stravaDisconnect.isPending ? 0.6 : 1,
            }}
          >
            {stravaDisconnect.isPending ? "Aguarde…" : "Desconectar"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => stravaConnect.mutate()}
          disabled={stravaConnect.isPending}
          className="w-full hv-card p-3.5 flex items-center gap-3 border-0 text-left"
          style={{ cursor: "pointer", opacity: stravaConnect.isPending ? 0.7 : 1 }}
        >
          <div
            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
            style={{ background: "hsl(var(--hv-coral) / 0.12)" }}
          >
            <HVIcon name="zap" size={18} color="hsl(var(--hv-coral))" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px]">Conectar Strava</div>
            <div className="text-[11px] text-hv-text-3">
              Sincronize seus treinos e atividades externas
            </div>
          </div>
          <HVIcon name="chevron-right" size={16} color="hsl(var(--hv-text-3))" />
        </button>
      )}

      {/* Gráfico frequência */}
      <div className="hv-card px-3.5 pt-3.5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em]">FREQUÊNCIA</div>
            <div className="font-display text-[28px] font-extrabold leading-[1.05] mt-0.5">
              {frequencyPct}%
            </div>
          </div>
          <div className="text-right">
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em]">STREAK MÁX</div>
            <div className="font-display text-[22px] font-extrabold text-hv-coral leading-[1.05] mt-0.5">
              {stats?.streakMax ?? 0} 🔥
            </div>
          </div>
        </div>
        <svg viewBox="0 0 340 110" className="w-full mt-2">
          <defs>
            <linearGradient id="grad-evo" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#25C7E5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#25C7E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {pathArea && <path d={pathArea} fill="url(#grad-evo)" />}
          {pathLine && (
            <path
              d={pathLine}
              stroke="#25C7E5"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {chartPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#FFFFFF"
              stroke="#25C7E5"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="flex justify-between text-[10px] text-hv-text-3 font-mono tracking-wide">
          {chartPoints.map((p, i) => (
            <span key={i}>{p.label}</span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {statCards.map((s) => (
          <div key={s.label} className="hv-card p-3">
            <div className="flex items-center justify-between">
              <span
                className="hv-mono text-[9px] tracking-wider text-hv-text-3 font-bold"
              >
                {s.label}
              </span>
              <HVIcon name={s.icon} size={14} color={s.color} />
            </div>
            <div
              className="font-display text-[22px] font-extrabold mt-1 leading-none"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-hv-text-3 mt-1">{s.detail}</div>
          </div>
        ))}
      </div>

      {/* Avaliações físicas */}
      <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mt-4 mb-2">
        Avaliações físicas
      </h3>
      <div className="hv-card overflow-hidden p-0">
        {assessments.length === 0 ? (
          <div className="p-5 text-center text-sm text-hv-text-2">
            Sem avaliações registradas ainda.
          </div>
        ) : (
          assessments.slice(0, 5).map((a, i, arr) => (
            <div
              key={a.id}
              className="px-3.5 py-3 flex items-center gap-3"
              style={{
                borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
              }}
            >
              <div className="flex-1">
                <div className="text-[13px] font-bold">
                  {formatAssessmentDate(a.assessed_at)}
                </div>
                <div className="hv-mono text-[10px] text-hv-text-3 mt-0.5 tracking-wide">
                  {a.weight_kg ? `PESO ${a.weight_kg} kg` : "—"}
                  {a.vo2max ? ` · VO₂ ${a.vo2max}` : ""}
                </div>
              </div>
              {a.notes && (
                <span className="hv-chip">
                  {a.notes.slice(0, 22)}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Treinos completados */}
      <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mt-4 mb-2">
        Treinos completados
      </h3>
      <div className="hv-card overflow-hidden p-0">
        {sessions.length === 0 ? (
          <div className="p-5 text-center text-sm text-hv-text-2">
            Sem sessões registradas ainda.
          </div>
        ) : (
          sessions.slice(0, 6).map((w, i, arr) => {
            const res = (w.results_json || {}) as Record<string, unknown>;
            const rpe = typeof res.rpe === "number" ? res.rpe : null;
            const dur =
              typeof res.duration_min === "number"
                ? `${res.duration_min} min`
                : typeof res.duration === "string"
                  ? res.duration
                  : "—";
            return (
              <div
                key={w.id}
                className="px-3.5 py-3 flex items-center gap-3"
                style={{
                  borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                }}
              >
                <div className="w-8 h-8 rounded-[10px] bg-hv-foam text-hv-navy grid place-items-center">
                  <HVIcon name="dumbbell" size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">
                    {w.title || "Sessão de treino"}
                  </div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5">
                    {formatSessionDate(w.session_date)} · {dur}
                  </div>
                </div>
                {rpe !== null && (
                  <div className="text-right">
                    <div className="hv-mono text-[9px] text-hv-text-3 tracking-wider">
                      RPE
                    </div>
                    <div className="font-display text-base font-bold">{rpe}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageScaffold>
  );
}
