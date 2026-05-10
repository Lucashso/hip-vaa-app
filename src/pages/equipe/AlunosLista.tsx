// AlunosLista — busca + filtros + lista de alunos da filial.
// Adaptado do HVAlunosLista (equipe-extras.jsx).

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useAlunos } from "@/hooks/useAlunos";
import { cn, getInitial } from "@/lib/utils";

const COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#F2B544", "#7B2D9F", "#25C7E5"];

type FilterKey = "all" | "active" | "pending" | "delinquent";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Em dia" },
  { key: "pending", label: "Pendentes" },
  { key: "delinquent", label: "Vencidos" },
];

function statusColor(s: string): string {
  if (s === "active") return "hsl(var(--hv-leaf))";
  if (s === "pending") return "hsl(var(--hv-amber))";
  if (s === "delinquent") return "hsl(var(--hv-coral))";
  return "hsl(var(--hv-text-3))";
}

function statusLabel(s: string): string {
  if (s === "active") return "em dia";
  if (s === "pending") return "pendente";
  if (s === "delinquent") return "vencido";
  if (s === "inactive") return "inativo";
  return s;
}

export default function AlunosLista() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: alunos, isLoading } = useAlunos(profile?.tenant_id, {
    status: filter,
    search,
  });

  const counts = useMemo(() => {
    if (!alunos) return { all: 0, active: 0, pending: 0, delinquent: 0 };
    const c = { all: alunos.length, active: 0, pending: 0, delinquent: 0 };
    alunos.forEach((a) => {
      if (a.status === "active") c.active += 1;
      else if (a.status === "pending") c.pending += 1;
      else if (a.status === "delinquent") c.delinquent += 1;
    });
    return c;
  }, [alunos]);

  const ativos = alunos?.filter((a) => a.status === "active").length ?? 0;
  const pendentes = alunos?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <PageScaffold
      eyebrow={`${ativos} ATIVOS · ${pendentes} PENDENTES`}
      title="Alunos"
      back
      showTabBar={false}
      trailing={
        <button
          type="button"
          className="px-3 py-2 rounded-[10px] bg-hv-navy text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <HVIcon name="plus" size={14} stroke={2.4} />
          Novo
        </button>
      }
    >
      {/* Busca + filter */}
      <div className="flex gap-2 items-center">
        <div
          className="flex-1 flex items-center gap-2 px-3.5 rounded-[12px] bg-hv-surface border border-hv-line"
          style={{ height: 44 }}
        >
          <HVIcon name="search" size={16} color="hsl(var(--hv-text-3))" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, matrícula, email…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-hv-text placeholder:text-hv-text-3"
          />
        </div>
        <button
          type="button"
          className="w-10 h-10 rounded-[12px] bg-hv-surface border border-hv-line grid place-items-center text-hv-text"
        >
          <HVIcon name="filter" size={18} />
        </button>
      </div>

      {/* Chips de filtro */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const count =
            f.key === "all" ? counts.all : f.key === "active" ? counts.active : f.key === "pending" ? counts.pending : counts.delinquent;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 hv-chip cursor-pointer",
                isActive
                  ? "!bg-hv-navy !text-white"
                  : "!bg-hv-surface !text-hv-text-2 border border-hv-line",
              )}
            >
              {f.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="hv-card overflow-hidden">
        {isLoading ? (
          <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">Carregando alunos…</div>
        ) : !alunos || alunos.length === 0 ? (
          <div className="px-3.5 py-8 text-center">
            <div className="text-[13px] font-semibold text-hv-text">Sem alunos por aqui</div>
            <div className="text-[11px] text-hv-text-3 mt-1">
              {search ? "Nenhum resultado para a busca." : "Adicione o primeiro aluno da filial."}
            </div>
          </div>
        ) : (
          alunos.map((a, i, arr) => {
            const name = a.profile?.full_name || "Sem nome";
            const inv = a.latest_invoice;
            const today = new Date().toISOString().split("T")[0];
            let invStatus = "em dia";
            let invColor = "hsl(var(--hv-leaf))";
            if (a.status === "delinquent") {
              invStatus = "vencido";
              invColor = "hsl(var(--hv-coral))";
            } else if (a.status === "pending") {
              invStatus = "pendente";
              invColor = "hsl(var(--hv-amber))";
            } else if (a.status === "inactive") {
              invStatus = "inativo";
              invColor = "hsl(var(--hv-text-3))";
            }
            if (inv && inv.status === "pending" && inv.due_date < today) {
              const days = Math.floor(
                (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24),
              );
              invStatus = `vencido ${days}d`;
              invColor = "hsl(var(--hv-coral))";
            }
            const planName = a.plan?.name || "Sem plano";
            const matricula = `#${a.id.slice(0, 6).toUpperCase()}`;
            const color = COLORS[i % COLORS.length];
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => navigate(`/equipe/alunos/${a.id}`)}
                className={cn(
                  "w-full text-left flex items-center gap-3 px-3.5 py-3 hover:bg-hv-foam/30",
                  i < arr.length - 1 && "border-b border-hv-line",
                )}
              >
                <div
                  className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                  style={{ background: color }}
                >
                  {getInitial(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[13px] font-bold truncate">{name}</span>
                    <span className="hv-mono text-[10px] text-hv-text-3 tracking-[0.04em]">
                      {matricula}
                    </span>
                  </div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                    {planName} · {statusLabel(a.status)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold" style={{ color: invColor }}>
                    {invStatus}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </PageScaffold>
  );
}
