// FilialEquipe — time da filial (mobile).
// Adaptado do HVFilialEquipe (equipe.jsx) — chips de filtro + lista de pessoas + papéis configurados.

import { useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

type Tag = "admin" | "instr" | "recep";

interface Person {
  name: string;
  role: string;
  tags: Tag[];
  color: string;
  initial: string;
  online: boolean;
}

const TIME: Person[] = [
  { name: "Manu Akana", role: "Admin + Instrutor", tags: ["admin", "instr"], color: "#1B6FB0", initial: "M", online: true },
  { name: "Lani Souza", role: "Instrutor sênior", tags: ["instr"], color: "#FF6B4A", initial: "L", online: true },
  { name: "Tane Kalani", role: "Instrutor", tags: ["instr"], color: "#2FB37A", initial: "T", online: true },
  { name: "Noa Hara", role: "Instrutor júnior", tags: ["instr"], color: "#F2B544", initial: "N", online: false },
  { name: "Aroha Silva", role: "Recepção", tags: ["recep"], color: "#25C7E5", initial: "A", online: true },
  { name: "Ben Costa", role: "Recepção · meio-período", tags: ["recep"], color: "#8395A4", initial: "B", online: false },
];

const TAG_STYLE: Record<Tag, { bg: string; fg: string; label: string }> = {
  admin: { bg: "rgba(14,58,95,0.12)", fg: "hsl(var(--hv-navy))", label: "ADMIN" },
  instr: { bg: "rgba(37,199,229,0.16)", fg: "hsl(var(--hv-blue))", label: "INSTR" },
  recep: { bg: "rgba(242,181,68,0.18)", fg: "hsl(var(--hv-amber))", label: "RECEP" },
};

const FILTERS = [
  { label: "Todos · 6", active: true },
  { label: "Admins · 1", active: false },
  { label: "Instrutores · 4", active: false },
  { label: "Recepção · 2", active: false },
];

const ROLE_SUMMARY = [
  { label: "Admin · Filial", description: "Tudo dentro da filial · sem multi-filial", count: 1, color: "hsl(var(--hv-navy))" },
  { label: "Instrutor", description: "Aulas, chamada, evolução do aluno", count: 4, color: "hsl(var(--hv-blue))" },
  { label: "Recepção", description: "Check-ins manuais + caixa do dia", count: 2, color: "hsl(var(--hv-amber))" },
  { label: "Aluno", description: "Auto-atribuído na matrícula", count: 184, color: "hsl(var(--hv-cyan))" },
];

export default function FilialEquipe() {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].label);

  return (
    <PageScaffold
      eyebrow="VILA VELHA · 6 PESSOAS"
      title="Equipe"
      back
      showTabBar={false}
      trailing={
        <button
          type="button"
          className="px-3 py-2 rounded-[10px] bg-hv-navy text-white text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <HVIcon name="plus" size={14} stroke={2.4} />
          Convidar
        </button>
      }
    >
      {/* Chips de filtro */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.label;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setActiveFilter(f.label)}
              className={cn(
                "shrink-0 hv-chip cursor-pointer",
                isActive
                  ? "!bg-hv-navy !text-white"
                  : "!bg-hv-surface !text-hv-text-2 border border-hv-line",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Lista de pessoas */}
      <div className="hv-card overflow-hidden">
        {TIME.map((p, i) => (
          <div
            key={p.name}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3",
              i < TIME.length - 1 && "border-b border-hv-line",
            )}
          >
            <div
              className="relative w-10 h-10 rounded-full grid place-items-center text-white font-display font-bold shrink-0"
              style={{ background: p.color }}
            >
              {p.initial}
              <span
                className="absolute -bottom-px -right-px w-3 h-3 rounded-full"
                style={{
                  background: p.online ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                  border: "2px solid hsl(var(--hv-surface))",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold">{p.name}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {p.tags.map((t) => {
                  const style = TAG_STYLE[t];
                  return (
                    <span
                      key={t}
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
                      style={{
                        background: style.bg,
                        color: style.fg,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {style.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
          </div>
        ))}
      </div>

      {/* Papéis configurados */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-6 mb-1">
        Papéis configurados
      </h3>
      <div className="hv-card overflow-hidden">
        {ROLE_SUMMARY.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3",
              i < ROLE_SUMMARY.length - 1 && "border-b border-hv-line",
            )}
          >
            <div
              className="w-1.5 h-9 rounded-sm shrink-0"
              style={{ background: r.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold">{r.label}</div>
              <div className="text-[11px] text-hv-text-2 mt-0.5">{r.description}</div>
            </div>
            <div className="text-right">
              <div
                className="font-display font-extrabold text-[18px] leading-none"
                style={{ color: r.color }}
              >
                {r.count}
              </div>
              <div className="font-mono text-[9px] text-hv-text-3 tracking-wider mt-0.5">
                PESSOAS
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageScaffold>
  );
}
