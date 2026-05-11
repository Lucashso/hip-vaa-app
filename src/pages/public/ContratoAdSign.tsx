// ContratoAdSign — passo 2 do fluxo de contrato AD.
// Rota: /contrato-ad/:token/contrato
// Mostra contrato com variáveis substituídas, exige scroll + aceite + assinatura.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { formatBRL } from "@/lib/utils";
import {
  useAdContractByToken,
  useSignAdContract,
  type PendingAdContract,
} from "@/hooks/useAdContractSignup";

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return labels[period] || period;
}

function getPeriodMonths(period: string): number {
  const months: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    annual: 12,
  };
  return months[period] || 1;
}

function formatDoc(doc: string | null): string {
  if (!doc) return "";
  const cleaned = doc.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return doc;
}

function getPaymentTypeLabel(contract: PendingAdContract): string {
  if (contract.card_payment_type === "recurring") return "Recorrente (assinatura automática)";
  if (contract.card_payment_type === "installments" && contract.max_installments) {
    return `Parcelado em ${contract.max_installments}x`;
  }
  if (contract.payment_method === "pix") return "PIX (à vista)";
  return "À vista";
}

function getRenewalClause(contract: PendingAdContract): string {
  if (contract.card_payment_type === "recurring") {
    return `\n\nCLÁUSULA DE RENOVAÇÃO AUTOMÁTICA\n\nO presente contrato será renovado automaticamente a cada período de ${getPeriodLabel(
      contract.period,
    ).toLowerCase()}, mediante cobrança recorrente no cartão de crédito cadastrado pelo ANUNCIANTE. A renovação persistirá até que uma das partes solicite formalmente o cancelamento, com antecedência mínima de 5 (cinco) dias úteis antes do vencimento do período vigente.`;
  }
  return "";
}

const FALLBACK_TEMPLATE = `CONTRATO DE PUBLICIDADE — HIP VA'A

CONTRATO Nº {{contract_id}}

CONTRATANTE: {{advertiser_name}}, inscrito(a) sob o documento {{advertiser_document}}, com email {{advertiser_email}} e telefone {{advertiser_phone}}.

CONTRATADA: Hip Va'a (Leme Hub Tecnologia Ltda.), responsável pela veiculação publicitária.

OBJETO: Veiculação de {{contract_type_label}} pelo período de {{period_label}} ({{period_months}} meses), entre {{start_date}} e {{end_date}}.

VALOR: {{amount}}, com forma de pagamento {{payment_type_label}}.

{{renewal_clause}}

DAS OBRIGAÇÕES:

1. O CONTRATANTE compromete-se a fornecer materiais publicitários adequados aos padrões técnicos solicitados pela CONTRATADA.

2. A CONTRATADA compromete-se a veicular o material conforme contratado, garantindo a exposição durante o período acordado.

3. Em caso de descumprimento por qualquer das partes, multa de 20% (vinte por cento) do valor total do contrato será aplicada.

ASSINATURA: {{signer_name}} — {{signature_date}}.

Hip Va'a — Aliança Polinésia Brasil.`;

export default function ContratoAdSign() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading, error, refetch } = useAdContractByToken(token);
  const signContract = useSignAdContract();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerCpf, setSignerCpf] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Template do contrato (platform_settings.ad_contract_template)
  const { data: templateText } = useQuery({
    queryKey: ["ad_contract_template"],
    queryFn: async (): Promise<string> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("platform_settings") as any)
          .select("value")
          .eq("key", "ad_contract_template")
          .maybeSingle();
        const v = data?.value;
        if (typeof v === "string" && v.trim().length > 0) return v;
        return FALLBACK_TEMPLATE;
      } catch {
        return FALLBACK_TEMPLATE;
      }
    },
    staleTime: 60_000,
  });

  // Roteamento auto baseado em status (pending volta pro cadastro, completed → sucesso).
  // contract_signed permanece aqui em modo read-only.
  useEffect(() => {
    if (!contract || !token) return;
    if (contract.status === "pending") {
      navigate(`/contrato-ad/${token}/cadastro`, { replace: true });
    } else if (contract.status === "completed") {
      navigate(`/contrato-ad/${token}/sucesso`, { replace: true });
    }
  }, [contract, token, navigate]);

  // Pré-preencher signer_name com advertiser_name
  useEffect(() => {
    if (contract?.advertiser_name && !signerName) {
      setSignerName(contract.advertiser_name);
    }
  }, [contract, signerName]);

  const isAlreadySigned = useMemo(
    () => contract?.status === "contract_signed" || contract?.status === "completed",
    [contract?.status],
  );

  const contractText = useMemo(() => {
    if (!contract) return "";
    const tpl = templateText || FALLBACK_TEMPLATE;
    const amountFormatted = formatBRL(contract.amount_cents);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + getPeriodMonths(contract.period));

    return tpl
      .replace(/{{contract_id}}/g, contract.id.slice(0, 8).toUpperCase())
      .replace(/{{advertiser_name}}/g, contract.advertiser_name || "")
      .replace(/{{advertiser_document}}/g, formatDoc(contract.advertiser_document))
      .replace(/{{advertiser_email}}/g, contract.advertiser_email || "")
      .replace(/{{advertiser_phone}}/g, formatPhone(contract.advertiser_phone || ""))
      .replace(
        /{{contract_type_label}}/g,
        contract.contract_type === "banner" ? "Banner publicitário" : "Parceria",
      )
      .replace(/{{period_label}}/g, getPeriodLabel(contract.period))
      .replace(/{{period_months}}/g, String(getPeriodMonths(contract.period)))
      .replace(/{{amount}}/g, amountFormatted)
      .replace(/{{start_date}}/g, startDate.toLocaleDateString("pt-BR"))
      .replace(/{{end_date}}/g, endDate.toLocaleDateString("pt-BR"))
      .replace(/{{signature_date}}/g, new Date().toLocaleDateString("pt-BR"))
      .replace(/{{signer_name}}/g, contract.signer_name || signerName || "_______________")
      .replace(/{{payment_type_label}}/g, getPaymentTypeLabel(contract))
      .replace(/{{renewal_clause}}/g, getRenewalClause(contract));
  }, [contract, templateText, signerName]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    if (t.scrollHeight - t.scrollTop <= t.clientHeight + 60) {
      setHasScrolled(true);
    }
  };

  if (isLoading) return <Loader />;

  if (error || !contract) {
    return (
      <EmptyState
        icon="x"
        title="Link inválido ou expirado"
        message="Este link de contrato não existe ou já não é válido."
        cta={{ label: "Voltar", onClick: () => navigate("/auth") }}
      />
    );
  }

  if (new Date(contract.expires_at) < new Date()) {
    return (
      <EmptyState
        icon="x"
        title="Link expirado"
        message="Este link expirou. Solicite um novo à equipe da Hip Va'a."
        cta={{ label: "Voltar", onClick: () => navigate("/auth") }}
      />
    );
  }

  // status `pending` ou `completed` já redireciona via useEffect — empty render
  if (contract.status === "pending" || contract.status === "completed") {
    return <Loader />;
  }

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      setSubmitError("Informe seu nome");
      return;
    }
    const cpfDigits = signerCpf.replace(/\D/g, "");
    if (cpfDigits.length > 0 && !isValidCPF(signerCpf)) {
      setSubmitError("Informe um CPF válido");
      return;
    }
    setSubmitError(null);

    try {
      await signContract.mutateAsync({
        token: token!,
        signer_name: signerName.trim(),
        signer_cpf: cpfDigits || undefined,
      });
      await refetch();
      toast.success("Contrato assinado!");
      navigate(`/contrato-ad/${token}/pagamento`);
    } catch {
      // toast já tratado no hook
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-4 pb-3.5">
        <button
          type="button"
          onClick={() => navigate(`/contrato-ad/${token}/cadastro`)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <h1 className="font-display text-[26px] mt-3">Assinatura do contrato</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          {contract.contract_type === "banner" ? "Banner publicitário" : "Parceria"} •{" "}
          {getPeriodLabel(contract.period)} • {formatBRL(contract.amount_cents)}
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Contract text */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="hv-card p-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-[1.55] text-hv-text-2"
          >
            {contractText}
          </div>

          {!hasScrolled && !isAlreadySigned && (
            <div className="text-[12px] text-hv-coral text-center">
              Role até o final do contrato para continuar
            </div>
          )}

          {isAlreadySigned ? (
            <div className="hv-card p-5 space-y-4">
              <div className="rounded-[12px] border border-hv-line bg-hv-foam p-4 text-center">
                <div className="font-semibold text-sm text-hv-navy">
                  ✓ Contrato assinado por {contract.signer_name}
                </div>
                {contract.signed_at && (
                  <div className="hv-mono text-[11px] text-hv-text-3 mt-1">
                    {new Date(contract.signed_at).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate(`/contrato-ad/${token}/pagamento`)}
                variant="accent"
                size="lg"
                className="w-full"
              >
                Ir para pagamento
                <HVIcon name="arrow-right" size={16} stroke={2.4} />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSign} className="hv-card p-5 space-y-4">
              <label className="flex items-start gap-2.5 cursor-pointer rounded-[12px] border border-hv-line p-3 bg-hv-surface">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={!hasScrolled}
                  className="mt-0.5"
                />
                <span className="text-[13px] text-hv-text-2">
                  Li e aceito os termos do contrato acima.
                </span>
              </label>

              <div className="space-y-2">
                <Input
                  placeholder="Nome do representante legal *"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  disabled={!accepted}
                  required
                />
                <Input
                  placeholder="CPF do representante (opcional)"
                  value={signerCpf}
                  onChange={(e) => setSignerCpf(formatCPF(e.target.value))}
                  disabled={!accepted}
                  inputMode="numeric"
                  maxLength={14}
                />
              </div>

              {submitError && (
                <div className="text-[12px] text-hv-coral text-center">{submitError}</div>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={!accepted || !signerName.trim() || signContract.isPending}
              >
                {signContract.isPending ? "Assinando…" : "Assinar contrato"}
                {!signContract.isPending && <HVIcon name="arrow-right" size={16} stroke={2.4} />}
              </Button>

              <div className="text-center hv-mono text-[10px] tracking-[0.2em] text-hv-text-3">
                PASSO 2 DE 3 · ASSINATURA DIGITAL
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  cta,
}: {
  icon: Parameters<typeof HVIcon>[0]["name"];
  title: string;
  message: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="hv-card p-6 text-center max-w-sm w-full">
        <div className="mx-auto w-14 h-14 rounded-full bg-hv-foam grid place-items-center mb-3">
          <HVIcon name={icon} size={28} stroke={2.4} color="hsl(var(--hv-navy))" />
        </div>
        <div className="font-display text-[18px]">{title}</div>
        <div className="text-sm text-hv-text-2 mt-2">{message}</div>
        {cta && (
          <Button onClick={cta.onClick} variant="primary" size="default" className="mt-4 w-full">
            {cta.label}
          </Button>
        )}
      </div>
    </div>
  );
}
