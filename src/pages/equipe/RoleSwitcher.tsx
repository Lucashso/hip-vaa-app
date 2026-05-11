// RoleSwitcher — troca de papel/filial (mobile).
// Adaptado do HVRoleSwitcher (equipe.jsx) — chips de filial + lista de papéis.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

interface RoleItem {
  id: string;
  label: string;
  description: string;
  icon: HVIconName;
  to: string;
}

const ROLES: RoleItem[] = [
  { id: "admin-filial", label: "Admin · Filial", description: "Vila Velha · gestão completa", icon: "trend", to: "/admin" },
  { id: "instrutor", label: "Instrutor", description: "Suas aulas + chamada", icon: "paddle", to: "/admin/aulas" },
  { id: "recepcao", label: "Recepção", description: "Check-ins + caixa", icon: "qr", to: "/admin/time" },
  { id: "aluno", label: "Modo Aluno", description: "Sua experiência pessoal", icon: "user", to: "/" },
];

const FILIAIS = [
  { label: "Vila Velha", active: true },
  { label: "Guarapari", active: false },
  { label: "Anchieta", active: false },
];

export default function RoleSwitcher() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<string>("admin-filial");

  return (
    <PageScaffold
      eyebrow="MANU AKANA · 3 PAPÉIS ATIVOS"
      title="Trocar papel"
      back
      showTabBar={false}
    >
      {/* Chips horizontais de filiais */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILIAIS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold border",
              f.active
                ? "bg-hv-navy text-white border-hv-navy"
                : "bg-hv-surface text-hv-text-2 border-hv-line",
            )}
          >
            <HVIcon name="compass" size={14} stroke={2} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de papéis */}
      <div className="hv-card overflow-hidden">
        {ROLES.map((r, i) => {
          const isOn = activeRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setActiveRole(r.id);
                navigate(r.to);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-3.5 text-left",
                i < ROLES.length - 1 && "border-b border-hv-line",
                isOn && "bg-hv-foam",
              )}
            >
              <div
                className={cn(
                  "w-[42px] h-[42px] rounded-[12px] grid place-items-center shrink-0",
                  isOn ? "bg-hv-navy text-white" : "bg-background text-hv-navy",
                )}
              >
                <HVIcon name={r.icon} size={20} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{r.label}</div>
                <div className="text-[11px] text-hv-text-2 mt-0.5">{r.description}</div>
              </div>
              {isOn ? (
                <span className="w-[22px] h-[22px] rounded-full bg-hv-leaf text-white grid place-items-center shrink-0">
                  <HVIcon name="check" size={14} stroke={3} />
                </span>
              ) : (
                <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
              )}
            </button>
          );
        })}
      </div>

      {/* Aviso cyan */}
      <div
        className="rounded-[14px] p-3.5 flex gap-2.5"
        style={{
          background: "hsl(var(--hv-cyan) / 0.1)",
          border: "1px solid hsl(var(--hv-cyan) / 0.25)",
        }}
      >
        <HVIcon name="zap" size={18} color="hsl(var(--hv-blue))" stroke={2.2} />
        <div className="text-xs text-hv-text-2 leading-relaxed">
          Permissões herdam da filial. Super admin global precisa do{" "}
          <b>console web</b>.
        </div>
      </div>
    </PageScaffold>
  );
}
