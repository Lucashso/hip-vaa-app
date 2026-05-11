// AssinarContrato — passo 2/3 do fluxo /assinar.
// Mostra contrato (de platform_settings.tenant_contract_template ou hardcoded),
// renderiza com substituição de variáveis, coleta assinatura digital
// e chama edge sign-tenant-contract.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { HVIcon } from "@/lib/HVIcon";
import { useSignTenantContract } from "@/hooks/useTenantSignup";
import { supabase } from "@/lib/supabase";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { cn, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface LocationState {
  pendingSignupId?: string;
  planName?: string;
  amountCents?: number;
  business_template?: string;
  responsible_name?: string;
  company_name?: string;
  document?: string;
  document_type?: "cpf" | "cnpj";
  payment_method?: "pix" | "credit_card";
}

const FALLBACK_TEMPLATE = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS — HIP VA'A

Contrato celebrado entre **Hip Va'a Tecnologia Ltda.** (CONTRATADA) e **{{company_name}}** (CONTRATANTE), inscrita no documento {{document}}.

## 1. OBJETO
A CONTRATADA fornecerá a plataforma digital Hip Va'a, na modalidade SaaS, para gestão completa de clubes esportivos, com acesso através do plano **{{plan_name}}**.

## 2. VALOR
O valor mensal do plano é de **{{amount}}**, devido conforme periodicidade contratada.

## 3. PRAZO
O contrato tem início em {{date}}, com renovação automática mensal, podendo ser cancelado a qualquer momento mediante aviso prévio de 30 dias.

## 4. DADOS
A CONTRATADA segue a LGPD. A CONTRATANTE é controladora dos dados de seus alunos.

## 5. DISPOSIÇÕES GERAIS
Este contrato é regido pelas leis brasileiras. Foro da comarca do Recife/PE.

Assinado digitalmente em {{date}} por {{signer_name}}.`;

function useContractTemplate() {
  return useQuery({
    queryKey: ["platform-settings", "tenant_contract_template"],
    queryFn: async (): Promise<string> => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "tenant_contract_template")
        .maybeSingle();
      const value = data?.value as { content?: string } | string | null;
      if (!value) return FALLBACK_TEMPLATE;
      if (typeof value === "string") return value;
      if (typeof value === "object" && value.content) return value.content;
      return FALLBACK_TEMPLATE;
    },
  });
}

function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export default function AssinarContrato() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const signMutation = useSignTenantContract();
  const { data: template, isLoading: templateLoading } = useContractTemplate();

  const [signerName, setSignerName] = useState(state.responsible_name ?? "");
  const [signerCpf, setSignerCpf] = useState("");
  const [accept, setAccept] = useState(false);

  const isCNPJ = state.document_type === "cnpj";

  useEffect(() => {
    if (!state.pendingSignupId) {
      toast.error("Sessão de cadastro perdida. Refaça o cadastro.");
      navigate("/assinar", { replace: true });
    }
  }, [state.pendingSignupId, navigate]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR");
  }, []);

  const renderedContract = useMemo(() => {
    if (!template) return "";
    return renderTemplate(template, {
      company_name: state.company_name ?? "—",
      document: state.document ?? "—",
      plan_name: state.planName ?? "—",
      amount: state.amountCents != null ? formatBRL(state.amountCents) : "—",
      date: today,
      signer_name: signerName || "—",
    });
  }, [template, state, today, signerName]);

  const validSubmit =
    accept &&
    signerName.trim().length >= 3 &&
    (!isCNPJ || (signerCpf.replace(/\D/g, "").length === 11 && isValidCPF(signerCpf)));

  const handleSign = async () => {
    if (!state.pendingSignupId) return;
    if (!validSubmit) {
      toast.error("Confira os dados de assinatura e aceite os termos.");
      return;
    }
    try {
      await signMutation.mutateAsync({
        pending_signup_id: state.pendingSignupId,
        signer_name: signerName.trim(),
        signer_cpf: isCNPJ ? signerCpf : undefined,
      });
      navigate("/assinar/pagamento", {
        state: {
          ...state,
        },
      });
    } catch {
      // toast no onError
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-4 pb-3.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.16em] mt-3">
          PASSO 2 / 3 · CONTRATO
        </div>
        <h1 className="font-display text-[26px] mt-1">Assinar contrato</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          Leia o contrato abaixo e assine digitalmente para liberar o pagamento.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8">
        <div className="max-w-[640px] mx-auto space-y-3">
          {/* Resumo */}
          <div className="hv-card p-4">
            <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em]">
              CONTRATO
            </div>
            <div className="font-display text-[18px] font-bold mt-1">
              {state.company_name ?? "—"}
            </div>
            <div className="text-[12px] text-hv-text-2 mt-0.5">
              {state.planName ?? "—"}
              {state.amountCents != null
                ? ` · ${formatBRL(state.amountCents)}`
                : ""}
            </div>
          </div>

          {/* Texto do contrato */}
          <div className="hv-card p-5">
            {templateLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={20} className="animate-spin text-hv-text-3" />
              </div>
            ) : (
              <div className="text-[13px] text-hv-text leading-[1.6] whitespace-pre-wrap max-h-[400px] overflow-auto pr-1 font-mono">
                {renderedContract}
              </div>
            )}
          </div>

          {/* Form de assinatura */}
          <div className="hv-card p-4">
            <h3 className="hv-eyebrow mb-3">Sua assinatura digital</h3>
            <div className="mb-3">
              <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
                Nome completo do signatário
                <span className="text-hv-coral"> *</span>
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy mt-1.5"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Como aparece no documento"
              />
            </div>

            {isCNPJ && (
              <div className="mb-3">
                <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
                  CPF do signatário
                  <span className="text-hv-coral"> *</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy mt-1.5"
                  value={signerCpf}
                  onChange={(e) => setSignerCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                />
                <div className="text-[11px] text-hv-text-3 mt-1">
                  Necessário porque a empresa é CNPJ.
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-hv-navy"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
              />
              <span className="text-[12px] text-hv-text-2 leading-[1.5]">
                Li e concordo com os termos do contrato acima. Esta assinatura
                tem validade jurídica (MP 2.200-2/2001).
              </span>
            </label>

            <button
              type="button"
              onClick={handleSign}
              disabled={!validSubmit || signMutation.isPending}
              className={cn(
                "w-full mt-4 h-12 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform",
                validSubmit
                  ? "bg-hv-cyan text-hv-ink"
                  : "bg-hv-line text-hv-text-3 cursor-not-allowed",
              )}
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Assinando…
                </>
              ) : (
                <>
                  Assinar e ir para pagamento
                  <HVIcon name="arrow-right" size={16} stroke={2.4} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
