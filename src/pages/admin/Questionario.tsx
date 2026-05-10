// Admin · Questionário de saúde — perguntas obrigatórias + reorder.
// Baseado em admin-mobile.jsx HVAdminQuestionario.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useHealthFields } from "@/hooks/useHealthFields";
import { useAuth } from "@/hooks/useAuth";

function typeLabel(t: string | null): string {
  switch ((t || "").toLowerCase()) {
    case "boolean":
      return "sim/não";
    case "text":
      return "texto livre";
    case "select":
      return "múltipla escolha";
    case "number":
      return "número";
    default:
      return t || "texto";
  }
}

export default function AdminQuestionario() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: fields = [], isLoading } = useHealthFields(tenantId);
  const [required, setRequired] = useState(true);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Questionário de saúde"
        sub={`OBRIGATÓRIO · ${fields.length} PERGUNTA${fields.length === 1 ? "" : "S"}`}
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        <div className="hv-card flex justify-between items-center" style={{ padding: 14 }}>
          <div className="min-w-0">
            <div className="text-[13px] font-bold">Obrigatório antes do 1º check-in</div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              Aluno só remabilita após preencher
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRequired((v) => !v)}
            className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
            style={{
              background: required ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
            }}
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

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-4 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Perguntas · arraste p/ reordenar
        </h3>

        {isLoading ? (
          <Loader />
        ) : fields.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhuma pergunta configurada.
          </div>
        ) : (
          <div className="hv-card overflow-hidden p-0">
            {fields.map((f, i, arr) => (
              <div
                key={f.id}
                className="flex items-center gap-2.5"
                style={{
                  padding: "12px 14px",
                  borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  opacity: f.is_critical ? 1 : 0.7,
                }}
              >
                <HVIcon name="menu" size={16} color="hsl(var(--hv-text-3))" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{f.label}</div>
                  <div
                    className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                    style={{ letterSpacing: "0.05em" }}
                  >
                    {typeLabel(f.field_type)}
                    {f.section ? ` · ${f.section}` : ""}
                  </div>
                </div>
                <span
                  className="w-2 h-2 rounded-[4px] shrink-0"
                  style={{
                    background: f.is_critical ? "hsl(var(--hv-coral))" : "hsl(var(--hv-leaf))",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
