// ContratoAdSignup — passo 1 do fluxo de contrato AD (banner/parceria).
// Rota: /contrato-ad/:token/cadastro
// Coleta dados do anunciante e chama edge `update-ad-contract-data`.
// Se a tabela `pending_ad_contracts` ainda não existir, mostra empty state.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import {
  useAdContractByToken,
  useUpdateAdContractData,
} from "@/hooks/useAdContractSignup";
import { formatPhone } from "@/lib/phone";
import { formatBRL } from "@/lib/utils";

function formatCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
}

function formatDocument(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 11) {
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return formatCNPJ(value);
}

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return labels[period] || period;
}

export default function ContratoAdSignup() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading, error } = useAdContractByToken(token);
  const updateData = useUpdateAdContractData();

  const [advertiserName, setAdvertiserName] = useState("");
  const [advertiserDocument, setAdvertiserDocument] = useState("");
  const [advertiserPhone, setAdvertiserPhone] = useState("");
  const [advertiserEmail, setAdvertiserEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pré-preencher se já tiver dados
  useEffect(() => {
    if (!contract) return;
    if (contract.advertiser_name) setAdvertiserName(contract.advertiser_name);
    if (contract.advertiser_document) setAdvertiserDocument(contract.advertiser_document);
    if (contract.advertiser_phone) setAdvertiserPhone(contract.advertiser_phone);
    if (contract.advertiser_email) setAdvertiserEmail(contract.advertiser_email);
  }, [contract]);

  // Roteamento auto baseado em status
  useEffect(() => {
    if (!contract || !token) return;
    if (contract.status === "data_filled") {
      navigate(`/contrato-ad/${token}/contrato`, { replace: true });
    } else if (contract.status === "contract_signed") {
      navigate(`/contrato-ad/${token}/pagamento`, { replace: true });
    } else if (contract.status === "completed") {
      navigate(`/contrato-ad/${token}/sucesso`, { replace: true });
    }
  }, [contract, token, navigate]);

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

  if (contract.status !== "pending") {
    // Já tratado no useEffect, mas evita render do form
    return <Loader />;
  }

  const validate = (): string | null => {
    if (!advertiserName.trim()) return "Nome / razão social é obrigatório";
    const doc = advertiserDocument.replace(/\D/g, "");
    if (doc.length !== 11 && doc.length !== 14) return "Informe um CPF ou CNPJ válido";
    if (advertiserPhone.replace(/\D/g, "").length < 10) return "Telefone inválido";
    if (!advertiserEmail.includes("@")) return "Email inválido";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setSubmitError(v);
      return;
    }
    setSubmitError(null);

    try {
      await updateData.mutateAsync({
        token: token!,
        advertiser_name: advertiserName.trim(),
        advertiser_document: advertiserDocument.replace(/\D/g, ""),
        advertiser_phone: advertiserPhone.replace(/\D/g, ""),
        advertiser_email: advertiserEmail.trim(),
      });
      navigate(`/contrato-ad/${token}/contrato`);
    } catch {
      // toast já tratado no hook
    }
  };

  const typeLabel = contract.contract_type === "banner" ? "Banner publicitário" : "Parceria";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-6 space-y-4">
        {/* Header */}
        <div className="hv-card p-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="wallet" size={28} stroke={2.2} color="hsl(var(--hv-navy))" />
          </div>
          <div className="hv-eyebrow">CONTRATO PUBLICITÁRIO</div>
          <h1 className="font-display text-[22px] mt-1 leading-tight">{typeLabel}</h1>
          <p className="text-[13px] text-hv-text-2 mt-2">
            Preencha seus dados para gerar o contrato.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 text-left">
            <div className="bg-hv-bg rounded-[12px] p-3">
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider">PERÍODO</div>
              <div className="font-bold text-sm mt-0.5">{getPeriodLabel(contract.period)}</div>
            </div>
            <div className="bg-hv-bg rounded-[12px] p-3">
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider">VALOR</div>
              <div className="font-bold text-sm mt-0.5">{formatBRL(contract.amount_cents)}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="hv-card p-5 space-y-4">
          <Section title="Seus dados" icon="user">
            <Input
              placeholder="Nome completo / razão social *"
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              required
            />
            <Input
              placeholder="CPF ou CNPJ *"
              value={formatDocument(advertiserDocument)}
              onChange={(e) => setAdvertiserDocument(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              required
            />
            <Input
              placeholder="Telefone *"
              value={formatPhone(advertiserPhone)}
              onChange={(e) => setAdvertiserPhone(e.target.value.replace(/\D/g, ""))}
              inputMode="tel"
              required
            />
            <Input
              type="email"
              placeholder="Email *"
              value={advertiserEmail}
              onChange={(e) => setAdvertiserEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Section>

          {submitError && (
            <div className="text-[12px] text-hv-coral text-center">{submitError}</div>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={updateData.isPending}
          >
            {updateData.isPending ? "Salvando…" : "Próximo"}
            {!updateData.isPending && <HVIcon name="arrow-right" size={16} stroke={2.4} />}
          </Button>

          <div className="text-center hv-mono text-[10px] tracking-[0.2em] text-hv-text-3">
            PASSO 1 DE 3 · SEUS DADOS
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: Parameters<typeof HVIcon>[0]["name"];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <HVIcon name={icon} size={16} color="hsl(var(--hv-navy))" />
        <div className="font-semibold text-sm">{title}</div>
      </div>
      <div className="space-y-2">{children}</div>
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
