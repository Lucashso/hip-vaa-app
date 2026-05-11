// FilialHome — dashboard mobile do admin de filial.
// Adaptado do HVFilialHome (equipe.jsx) — header gradient ocean + KPIs + agora na água + atalhos + aprovações.

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn, getInitial } from "@/lib/utils";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  color: string;
  icon: HVIconName;
}

const KPIS: Kpi[] = [
  { label: "ALUNOS ATIVOS", value: "184", delta: "+6 vs abr", color: "hsl(var(--hv-leaf))", icon: "users" },
  { label: "RECEITA MAIO", value: "R$ 41.2k", delta: "+8.4%", color: "hsl(var(--hv-leaf))", icon: "trend" },
  { label: "FREQUÊNCIA", value: "92%", delta: "−1pp", color: "hsl(var(--hv-amber))", icon: "check" },
  { label: "INADIMPLÊNCIA", value: "R$ 1.8k", delta: "7 alunos", color: "hsl(var(--hv-coral))", icon: "wallet" },
];

interface AulaAtiva {
  turma: string;
  hora: string;
  v: number;
  total: number;
  instrutor: string;
  live: boolean;
}

const AULAS_ATIVAS: AulaAtiva[] = [
  { turma: "OC6 Avançado", hora: "06:00", v: 12, total: 14, instrutor: "Manu", live: true },
  { turma: "Iniciante", hora: "07:00", v: 8, total: 12, instrutor: "Lani", live: true },
  { turma: "V1 Técnica", hora: "08:00", v: 0, total: 8, instrutor: "Tane", live: false },
];

interface Shortcut {
  label: string;
  description: string;
  icon: HVIconName;
  color: string;
  badge?: number;
  to: string;
}

const SHORTCUTS: Shortcut[] = [
  { label: "Alunos", description: "184 ativos · 3 inativos", icon: "users", color: "#1B6FB0", to: "/admin/alunos" },
  { label: "Equipe", description: "8 instrutores · 2 recepção", icon: "user", color: "#2FB37A", to: "/admin/time" },
  { label: "Cobrança", description: "7 inadimplentes", icon: "wallet", color: "#FF6B4A", badge: 7, to: "/admin/financeiro" },
  { label: "Configurações", description: "Filial, gateways, regras", icon: "settings", color: "#F2B544", to: "/admin/configuracoes" },
];

interface Aprovacao {
  title: string;
  meta: string;
  icon: HVIconName;
  color: string;
}

const APROVACOES: Aprovacao[] = [
  { title: "Trocar Aroha p/ turma 18:00", meta: "solicitado por Aroha S. · 2h", icon: "calendar", color: "#1B6FB0" },
  { title: "Cancelar matrícula · Ben C.", meta: "motivo: mudança de cidade · 5h", icon: "x", color: "#FF6B4A" },
  { title: "Ajuste de mensalidade · −20%", meta: "Cami R. · plano semestral", icon: "wallet", color: "#F2B544" },
];

export default function FilialHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: tenant } = useTenant();

  const fullName = profile?.full_name || "Equipe";
  const tenantName = tenant?.name || "Vila Velha";
  const tenantUpper = tenantName.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header gradient ocean */}
      <div
        className="text-white"
        style={{
          background: "linear-gradient(135deg, hsl(var(--hv-ink)), hsl(var(--hv-navy)))",
        }}
      >
        <div className="max-w-md mx-auto px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] grid place-items-center font-display font-extrabold bg-white/15 text-white">
              {getInitial(fullName)}
            </div>
            <div className="flex-1 leading-tight min-w-0">
              <div className="font-mono text-[10px] opacity-70 tracking-[0.16em] font-semibold">
                ADMIN · {tenantUpper}
              </div>
              <div className="font-display text-[16px] font-bold mt-0.5 text-white truncate">
                {fullName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/papel")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-white"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              Trocar
              <HVIcon name="chevron-down" size={14} />
            </button>
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] opacity-70 tracking-[0.2em]">
              QUI · 09 MAIO · OPERAÇÃO ATIVA
            </div>
            <h1 className="font-display text-[26px] mt-1 leading-[1.1] text-white">
              Sua filial em<br />tempo real
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* KPI grid 2x2 */}
        <div className="px-4 py-4 grid grid-cols-2 gap-2.5">
          {KPIS.map((k) => (
            <div key={k.label} className="hv-card p-3.5">
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[9px] tracking-wider font-bold text-hv-text-3"
                >
                  {k.label}
                </span>
                <HVIcon name={k.icon} size={14} color={k.color} />
              </div>
              <div className="font-display font-extrabold text-[22px] leading-none mt-1.5">
                {k.value}
              </div>
              <div
                className="text-[11px] font-semibold mt-1"
                style={{ color: k.color }}
              >
                {k.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Agora na água */}
        <div className="px-4 pb-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
              Agora na água
            </h3>
            <span className="font-mono text-[10px] text-hv-text-3">3 turmas</span>
          </div>
          <div className="hv-card py-1">
            {AULAS_ATIVAS.map((a, i) => (
              <div
                key={a.turma}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3",
                  i < AULAS_ATIVAS.length - 1 && "border-b border-hv-line",
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: a.live ? "hsl(var(--hv-coral))" : "hsl(var(--hv-amber))",
                    boxShadow: a.live ? "0 0 0 4px rgba(255,107,74,0.18)" : "none",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{a.turma}</div>
                  <div className="font-mono text-[10px] text-hv-text-3">
                    {a.hora} · {a.instrutor}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-sm">
                    {a.v}/{a.total}
                  </div>
                  <div className="text-[10px] text-hv-text-3">
                    {a.live ? "ao vivo" : "em breve"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operação rápida */}
        <div className="px-4 pb-3.5">
          <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mb-2">
            Operação rápida
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  if (s.to !== "#") navigate(s.to);
                }}
                className="hv-card p-3.5 text-left relative cursor-pointer hover:bg-hv-foam/30"
              >
                <div
                  className="w-8 h-8 rounded-[10px] grid place-items-center mb-2.5"
                  style={{
                    background: `${s.color}1F`,
                    color: s.color,
                  }}
                >
                  <HVIcon name={s.icon} size={16} stroke={2.2} />
                </div>
                <div className="text-[13px] font-bold">{s.label}</div>
                <div className="text-[11px] text-hv-text-2 mt-0.5">{s.description}</div>
                {s.badge && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                    style={{ background: s.color }}
                  >
                    {s.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Aprovações pendentes */}
        <div className="px-4">
          <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mb-2">
            Aprovações pendentes
          </h3>
          <div className="hv-card overflow-hidden">
            {APROVACOES.map((it, i) => (
              <div
                key={it.title}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3",
                  i < APROVACOES.length - 1 && "border-b border-hv-line",
                )}
              >
                <div
                  className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                  style={{
                    background: `${it.color}1F`,
                    color: it.color,
                  }}
                >
                  <HVIcon name={it.icon} size={16} stroke={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{it.title}</div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5">{it.meta}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="w-[30px] h-[30px] rounded-lg grid place-items-center text-hv-coral"
                    style={{ background: "rgba(255,107,74,0.12)" }}
                  >
                    <HVIcon name="x" size={14} stroke={2.6} />
                  </button>
                  <button
                    type="button"
                    className="w-[30px] h-[30px] rounded-lg grid place-items-center bg-hv-leaf text-white"
                  >
                    <HVIcon name="check" size={14} stroke={2.6} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav vem do AdminLayout (AdminBottomNav). */}
    </div>
  );
}
