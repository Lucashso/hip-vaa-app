// InstrutorChamada — chamada ao vivo (mobile).
// Adaptado do HVInstrutorChamada (instrutor.jsx) — stats + busca + lista de presença.

import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

type Status = "presente" | "atraso" | "ausente";

interface Aluno {
  name: string;
  matricula: string;
  status: Status;
  hora: string | null;
  initial: string;
  color: string;
  online: boolean;
}

const ALUNOS_INITIAL: Aluno[] = [
  { name: "Kai Nakoa", matricula: "VV-074", status: "presente", hora: "05:54", initial: "K", color: "#1B6FB0", online: true },
  { name: "Liana Mendes", matricula: "VV-082", status: "presente", hora: "05:58", initial: "L", color: "#FF6B4A", online: true },
  { name: "Marco Vargas", matricula: "VV-021", status: "presente", hora: "06:01", initial: "M", color: "#2FB37A", online: true },
  { name: "Aroha Silva", matricula: "VV-098", status: "ausente", hora: null, initial: "A", color: "#F2B544", online: false },
  { name: "Tane Kalani", matricula: "VV-103", status: "presente", hora: "06:04", initial: "T", color: "#25C7E5", online: true },
  { name: "Noa Hara", matricula: "VV-119", status: "atraso", hora: "06:18", initial: "N", color: "#8395A4", online: true },
  { name: "Luana Pacheco", matricula: "VV-067", status: "presente", hora: "05:51", initial: "L", color: "#0E3A5F", online: true },
];

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

const STATUS_ORDER: Status[] = ["presente", "atraso", "ausente"];

export default function InstrutorChamada() {
  useParams<{ classId: string }>();
  const [alunos, setAlunos] = useState<Aluno[]>(ALUNOS_INITIAL);

  const presentes = alunos.filter((a) => a.status === "presente").length;
  const atrasos = alunos.filter((a) => a.status === "atraso").length;
  const faltam = alunos.filter((a) => a.status === "ausente").length;
  const total = 14;

  const cycleStatus = (idx: number) => {
    setAlunos((prev) => {
      const next = [...prev];
      const cur = next[idx].status;
      const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length];
      next[idx] = { ...next[idx], status: nextStatus };
      return next;
    });
  };

  const stats = [
    { value: presentes, label: "Presentes", color: "hsl(var(--hv-leaf))" },
    { value: atrasos, label: "Atraso", color: "hsl(var(--hv-amber))" },
    { value: faltam, label: "Faltam", color: "hsl(var(--hv-coral))" },
    { value: total, label: "Total", color: "hsl(var(--hv-text-2))" },
  ];

  return (
    <PageScaffold
      eyebrow="QUI · 06:00 · CHAMADA AO VIVO"
      title="OC6 Avançado"
      back
      showTabBar={false}
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

      {/* Busca + scan */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-11 px-3.5 rounded-[12px] bg-hv-surface border border-hv-line flex items-center gap-2">
          <HVIcon name="search" size={16} color="hsl(var(--hv-text-3))" />
          <input
            type="text"
            placeholder="Buscar aluno…"
            className="flex-1 bg-transparent text-[13px] placeholder:text-hv-text-3 focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="h-11 px-3.5 rounded-[12px] bg-hv-cyan text-hv-ink font-semibold text-[13px] inline-flex items-center gap-1.5"
        >
          <HVIcon name="qr" size={16} stroke={2.2} />
          Scan
        </button>
      </div>

      {/* Lista de alunos */}
      <div className="hv-card overflow-hidden">
        {alunos.map((a, i) => {
          const style = STATUS_STYLE[a.status];
          return (
            <div
              key={a.matricula}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3",
                i < alunos.length - 1 && "border-b border-hv-line",
                a.status === "presente" && "bg-[rgba(47,179,122,0.04)]",
              )}
            >
              <div
                className="relative w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                style={{ background: a.color }}
              >
                {a.initial}
                <span
                  className="absolute -bottom-px -right-px w-3 h-3 rounded-full"
                  style={{
                    background: a.online ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                    border: "2px solid hsl(var(--hv-surface))",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{a.name}</div>
                <div className="font-mono text-[10px] text-hv-text-3 tracking-wider">
                  {a.matricula}
                  {a.hora && ` · ${a.hora}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => cycleStatus(i)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
                style={{ background: style.bg, color: style.fg }}
              >
                <HVIcon name={style.icon} size={12} stroke={2.6} />
                {style.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Encerrar */}
      <button
        type="button"
        className="w-full py-3.5 rounded-[14px] bg-hv-navy text-white font-bold text-sm hover:bg-hv-blue transition-colors"
      >
        Encerrar chamada
      </button>
    </PageScaffold>
  );
}
