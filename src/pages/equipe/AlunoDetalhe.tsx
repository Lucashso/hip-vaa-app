// AlunoDetalhe — ficha do aluno (admin/equipe).
// Adaptado do HVAlunoDetalhe (equipe-extras.jsx). Header customizado (gradient + tabs).

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { useAlunoDetalhe } from "@/hooks/useAlunos";
import { Loader } from "@/components/Loader";
import { cn, formatBRL, getInitial } from "@/lib/utils";

type TabKey = "resumo" | "aulas" | "financeiro" | "evolucao" | "docs";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "resumo", label: "Resumo" },
  { key: "aulas", label: "Aulas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "evolucao", label: "Evolução" },
  { key: "docs", label: "Docs" },
];

const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function tempoNoClube(createdAt?: string): string {
  if (!createdAt) return "—";
  const created = new Date(createdAt);
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths}m no clube`;
  if (remMonths === 0) return `${years}y no clube`;
  return `${years}y ${remMonths}m no clube`;
}

function statusChipColor(s: string): { bg: string; fg: string; label: string } {
  if (s === "active")
    return {
      bg: "rgba(47,179,122,0.25)",
      fg: "#7FE5B0",
      label: "em dia",
    };
  if (s === "pending")
    return {
      bg: "rgba(242,181,68,0.25)",
      fg: "#F2B544",
      label: "pendente",
    };
  if (s === "delinquent")
    return {
      bg: "rgba(255,107,74,0.25)",
      fg: "#FF6B4A",
      label: "vencido",
    };
  return { bg: "rgba(255,255,255,0.15)", fg: "white", label: s };
}

function formatDate(d: string): string {
  const date = new Date(d);
  return `${WEEKDAY_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatTime(t: string): string {
  return t?.slice(0, 5) ?? "";
}

export default function AlunoDetalhe() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const studentId = params.id;
  const { data, isLoading } = useAlunoDetalhe(studentId);
  const [tab, setTab] = useState<TabKey>("resumo");

  const fullName = data?.profile?.full_name || "Aluno";
  const nivel = "Avançado";
  const matricula = data?.student?.id ? `#${data.student.id.slice(0, 6).toUpperCase()}` : "";
  const tempo = tempoNoClube(data?.student?.created_at);
  const statusChip = statusChipColor(data?.student?.status || "active");

  const totalAulas = data?.checkins.length ?? 0;
  const freq = "—";
  const streak = "—";

  const planLabel = data?.plan?.name ?? "Sem plano";
  const planPrice = data?.plan?.price_cents ?? 0;

  const turmas = useMemo(() => {
    if (!data) return [];
    return data.enrollments
      .filter((e) => e.active && e.class)
      .map((e) => {
        const c = e.class!;
        return `${WEEKDAY_SHORT[c.weekday]} ${formatTime(c.start_time)} · ${c.venue?.name || "—"}`;
      });
  }, [data]);

  const checkinsRecentes = (data?.checkins ?? []).slice(0, 4).map((c) => ({
    date: formatDate(c.ts),
    time: new Date(c.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    method: c.method,
    label: "presente",
    color: "hsl(var(--hv-leaf))",
  }));

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header customizado (gradient) */}
      <div
        style={{
          padding: "16px 16px 18px",
          background: "linear-gradient(140deg, #061826, #1B6FB0)",
          color: "white",
        }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-[10px] grid place-items-center text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <HVIcon name="chevron-left" size={18} />
            </button>
            <div className="hv-mono flex-1 text-[10px] opacity-70 tracking-[0.14em]">
              FICHA DO ALUNO
            </div>
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              Editar
            </button>
          </div>
          <div className="flex items-center gap-3.5 mt-3.5">
            <div
              className="w-16 h-16 rounded-full grid place-items-center font-display font-extrabold text-white"
              style={{
                background: "#1B6FB0",
                fontSize: 28,
                border: "3px solid rgba(255,255,255,0.25)",
              }}
            >
              {getInitial(fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-white text-[22px] leading-tight mb-0.5 truncate">
                {fullName}
              </h1>
              <div className="text-xs opacity-85 truncate">
                {matricula} · {nivel} · {tempo}
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span
                  className="hv-chip"
                  style={{ background: statusChip.bg, color: statusChip.fg }}
                >
                  {statusChip.label}
                </span>
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(37,199,229,0.2)",
                    color: "hsl(var(--hv-cyan))",
                  }}
                >
                  {planLabel} · {formatBRL(planPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-hv-surface border-b border-hv-line">
        <div className="max-w-md mx-auto flex gap-4 px-4 pt-3 pb-1.5 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "py-1.5 bg-transparent border-none text-[13px] whitespace-nowrap",
                  active ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
                )}
                style={{
                  borderBottom: active ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das tabs */}
      <div className="max-w-md mx-auto px-4 pt-3.5 pb-6 space-y-4">
        {tab === "resumo" && (
          <>
            {/* Stats 3 colunas */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "AULAS", v: String(totalAulas) },
                { l: "FREQ", v: freq },
                { l: "STREAK", v: streak, coral: true },
              ].map((s) => (
                <div key={s.l} className="hv-card text-center" style={{ padding: 10 }}>
                  <div className="hv-mono text-[9px] text-hv-text-3 tracking-wider font-bold">
                    {s.l}
                  </div>
                  <div
                    className="font-display font-extrabold mt-0.5"
                    style={{
                      fontSize: 20,
                      color: s.coral ? "hsl(var(--hv-coral))" : "hsl(var(--hv-text))",
                    }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
              Plano & matrículas
            </h3>
            <div className="hv-card" style={{ padding: 14 }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[13px] font-bold">{planLabel}</div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5">
                    desde{" "}
                    {data?.student?.created_at
                      ? new Date(data.student.created_at).toLocaleDateString("pt-BR", {
                          month: "short",
                          year: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
                <div className="font-display font-extrabold text-lg">
                  {formatBRL(planPrice)}
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-hv-line">
                <div className="hv-mono text-[9px] text-hv-text-3 tracking-wider font-bold mb-1.5">
                  TURMAS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {turmas.length > 0 ? (
                    turmas.map((t, i) => (
                      <span
                        key={i}
                        className="hv-chip"
                        style={{
                          background: "hsl(var(--hv-foam))",
                          color: "hsl(var(--hv-navy))",
                        }}
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-hv-text-3">Sem matrículas ativas</span>
                  )}
                </div>
              </div>
            </div>

            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
              Últimos check-ins
            </h3>
            <div className="hv-card overflow-hidden">
              {checkinsRecentes.length === 0 ? (
                <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">
                  Nenhum check-in registrado.
                </div>
              ) : (
                checkinsRecentes.map((c, i, arr) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5",
                      i < arr.length - 1 && "border-b border-hv-line",
                    )}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold">
                        {c.date} · {c.time}
                      </div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5">
                        {c.method.toUpperCase()}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: c.color }}>
                      {c.label}
                    </span>
                  </div>
                ))
              )}
            </div>

            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
              Ações rápidas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Cobrar fatura", icon: "wallet" as const },
                { l: "Trocar turma", icon: "calendar" as const },
                { l: "Promover a equipe", icon: "trophy" as const },
                { l: "Cancelar matrícula", icon: "x" as const, red: true },
              ].map((a) => (
                <button
                  key={a.l}
                  type="button"
                  className="hv-card flex items-center gap-2 cursor-pointer hover:bg-hv-foam/30"
                  style={{
                    padding: "12px 14px",
                    color: a.red ? "hsl(var(--hv-coral))" : "hsl(var(--hv-text))",
                    background: "hsl(var(--hv-surface))",
                  }}
                >
                  <HVIcon name={a.icon} size={16} />
                  <span className="text-xs font-semibold text-left">{a.l}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "aulas" && (
          <>
            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
              Matrículas ativas
            </h3>
            <div className="hv-card overflow-hidden">
              {data?.enrollments && data.enrollments.length > 0 ? (
                data.enrollments
                  .filter((e) => e.class)
                  .map((e, i, arr) => (
                    <div
                      key={e.id}
                      className={cn(
                        "px-3.5 py-3",
                        i < arr.length - 1 && "border-b border-hv-line",
                      )}
                    >
                      <div className="text-[13px] font-bold">
                        {WEEKDAY_SHORT[e.class!.weekday]} · {formatTime(e.class!.start_time)} →{" "}
                        {formatTime(e.class!.end_time)}
                      </div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5">
                        {e.class!.venue?.name || "Local indefinido"}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">
                  Sem matrículas ativas.
                </div>
              )}
            </div>
          </>
        )}

        {tab === "financeiro" && (
          <>
            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
              Faturas recentes
            </h3>
            <div className="hv-card overflow-hidden">
              {data?.invoices && data.invoices.length > 0 ? (
                data.invoices.map((inv, i, arr) => {
                  const cor =
                    inv.status === "paid"
                      ? "hsl(var(--hv-leaf))"
                      : inv.status === "pending"
                        ? "hsl(var(--hv-amber))"
                        : "hsl(var(--hv-coral))";
                  return (
                    <div
                      key={inv.id}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-3",
                        i < arr.length - 1 && "border-b border-hv-line",
                      )}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold">
                          Vencimento {new Date(inv.due_date).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-[11px] text-hv-text-3 mt-0.5">
                          {inv.status === "paid" && inv.paid_at
                            ? `paga em ${new Date(inv.paid_at).toLocaleDateString("pt-BR")}`
                            : inv.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-sm">
                          {formatBRL(inv.amount_cents)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">
                  Nenhuma fatura registrada.
                </div>
              )}
            </div>
          </>
        )}

        {tab === "evolucao" && (
          <div className="hv-card p-6 text-center">
            <div className="text-[13px] font-semibold">Em breve</div>
            <div className="text-[11px] text-hv-text-3 mt-1">
              Histórico de evolução técnica do aluno.
            </div>
            <button
              type="button"
              onClick={() => studentId && navigate(`/equipe/evolucao/${studentId}`)}
              className="mt-3 hv-chip cursor-pointer !bg-hv-navy !text-white"
            >
              Abrir evolução completa
            </button>
          </div>
        )}

        {tab === "docs" && (
          <div className="hv-card p-6 text-center">
            <div className="text-[13px] font-semibold">Documentos</div>
            <div className="text-[11px] text-hv-text-3 mt-1">
              Contrato, ficha de saúde e anexos do aluno.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
