// Cadastro público — placeholder visual multi-passo (passo 2/3: dados + plano + PIX).
// Não persiste no DB — é só layout pixel-perfect do design.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

interface PlanOption {
  id: string;
  label: string;
  priceLabel: string;
  description: string;
}

const PLANS: PlanOption[] = [
  {
    id: "mensal",
    label: "Mensal · ilimitado",
    priceLabel: "R$ 280",
    description: "todas as turmas + passeios c/ desconto",
  },
  {
    id: "trimestral",
    label: "Trimestral",
    priceLabel: "R$ 750",
    description: "−10% · 1ª avaliação grátis",
  },
  {
    id: "avulso",
    label: "Avulso",
    priceLabel: "R$ 60",
    description: "1 aula · sem fidelização",
  },
];

const STATIC_FIELDS = [
  { label: "Nome completo", value: "Kai Nakoa Silva", help: "como aparece no documento" },
  { label: "Celular", value: "(27) 99876-1402", help: "para confirmação por WhatsApp" },
  { label: "E-mail", value: "kai@hipvaa.com.br", help: "" },
  { label: "Data de nascimento", value: "14/02/1992", help: "" },
];

export default function StudentCadastro() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { data: tenant } = useTenant();
  const [selectedPlan, setSelectedPlan] = useState<string>("mensal");

  const filialLabel = tenant?.name || (tenantSlug ? tenantSlug.replace(/-/g, " ") : "Vila Velha");
  const activePlan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-1.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <div className="hv-mono flex-1 text-[10px] text-hv-text-3 tracking-[0.16em]">
          PASSO 2 / 3 · DADOS
        </div>
        <span className="hv-chip capitalize">{filialLabel}</span>
      </div>

      <div className="px-5 mt-2">
        <div className="flex gap-1.5 mb-[18px]">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "flex-1 h-1 rounded",
                n <= 2 ? "bg-hv-cyan" : "bg-hv-line",
              )}
            />
          ))}
        </div>
        <h1 className="font-display text-[26px] leading-[1.05]">Bora começar a remar</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5 leading-[1.5]">
          Em menos de 2 minutos você está matriculado e com sua aula avulsa garantida.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-6">
        {STATIC_FIELDS.map((f, i) => (
          <div key={f.label} className="mb-[14px]">
            <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
              {f.label}
            </label>
            <div className="mt-1.5 px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface flex items-center justify-between">
              <span className="text-sm">{f.value}</span>
              {i === 1 && <HVIcon name="check" size={16} color="hsl(var(--hv-leaf))" />}
            </div>
            {f.help && (
              <div className="text-[11px] text-hv-text-3 mt-1">{f.help}</div>
            )}
          </div>
        ))}

        <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mt-[18px] mb-2.5">
          Escolha o plano
        </h3>
        {PLANS.map((p) => {
          const on = p.id === selectedPlan;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlan(p.id)}
              className={cn(
                "w-full text-left p-3.5 rounded-[14px] mb-2.5 flex items-center gap-3 transition-colors",
                on
                  ? "border-2 border-hv-navy bg-hv-foam"
                  : "border border-hv-line bg-hv-surface",
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full grid place-items-center",
                  on ? "bg-hv-navy" : "border-2 border-hv-line",
                )}
              >
                {on && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{p.label}</div>
                <div className="text-[11px] text-hv-text-3 mt-0.5">{p.description}</div>
              </div>
              <div className="font-display font-bold text-base">{p.priceLabel}</div>
            </button>
          );
        })}

        <button
          type="button"
          className="w-full mt-[18px] px-3.5 py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          Pagar com Pix · {activePlan.priceLabel}
          <HVIcon name="arrow-right" size={16} stroke={2.4} />
        </button>
        <p className="text-[11px] text-hv-text-3 text-center mt-2.5 leading-[1.5]">
          Ao continuar você aceita os <u>termos do clube</u> e o{" "}
          <u>questionário de saúde</u>.
        </p>
      </div>
    </div>
  );
}
