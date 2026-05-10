// Admin · Termos de uso — editor + histórico versões.
// Baseado em admin-mobile.jsx HVAdminTermos.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { useTenant } from "@/hooks/useTenant";

const TOOLS = ["B", "I", "•", "¶", "↶"];

const FALLBACK_HISTORY = [
  { v: "v1.0 (atual)", d: "atual", on: true },
];

export default function AdminTermos() {
  const { data: tenant, isLoading } = useTenant();
  const [required, setRequired] = useState(true);

  const contractText = tenant?.contract_text || "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Termos de uso" sub="VERSÃO ATUAL · v1.0" />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        <div className="hv-card flex justify-between items-center" style={{ padding: 14 }}>
          <div className="min-w-0">
            <div className="text-[13px] font-bold">Exigir aceite na matrícula</div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              Novo aluno precisa aceitar antes
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRequired((v) => !v)}
            className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
            style={{ background: required ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))" }}
          >
            <div
              className="w-5 h-5 rounded-[10px] bg-white"
              style={{
                transform: required ? "translateX(18px)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>

        <div className="hv-card mt-3 overflow-hidden p-0">
          <div
            className="flex gap-1.5 px-3 py-2"
            style={{
              borderBottom: "1px solid hsl(var(--hv-line))",
              background: "hsl(var(--hv-bg))",
            }}
          >
            {TOOLS.map((x, i) => (
              <button
                key={`${x}-${i}`}
                type="button"
                className="w-7 h-7 rounded-[6px] bg-transparent border-0 font-bold text-hv-text-2 cursor-pointer"
              >
                {x}
              </button>
            ))}
          </div>
          <div
            className="p-3.5 text-[12px] text-hv-text-2"
            style={{ lineHeight: 1.65 }}
          >
            {isLoading ? (
              <Loader />
            ) : contractText ? (
              <p className="whitespace-pre-wrap">{contractText}</p>
            ) : (
              <>
                <p>
                  <b>1. Aceite e adesão.</b> Ao matricular-se no Hip Va&apos;a, você concorda em
                  respeitar as regras de segurança da prática de canoa havaiana...
                </p>
                <p className="mt-2">
                  <b>2. Uso de equipamentos.</b> As embarcações, remos e coletes devem ser
                  devolvidos no mesmo estado em que foram retirados...
                </p>
                <p className="mt-2">
                  <b>3. Frequência e mensalidade.</b> A mensalidade é devida mesmo em casos de
                  ausência por motivos pessoais...
                </p>
              </>
            )}
          </div>
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-4 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Histórico de versões
        </h3>
        <div className="hv-card overflow-hidden p-0">
          {FALLBACK_HISTORY.map((h, i, a) => (
            <div
              key={h.v}
              className="flex items-center gap-2.5"
              style={{
                padding: "10px 14px",
                borderBottom: i < a.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
              }}
            >
              <span
                className="hv-mono flex-1 text-[12px]"
                style={{
                  fontWeight: h.on ? 700 : 500,
                  color: h.on ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-2))",
                }}
              >
                {h.v}
              </span>
              <span className="text-[11px] text-hv-text-3">{h.d}</span>
              {!h.on && (
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold text-hv-text"
                  style={{
                    background: "hsl(var(--hv-bg))",
                    border: "1px solid hsl(var(--hv-line))",
                  }}
                >
                  Restaurar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
