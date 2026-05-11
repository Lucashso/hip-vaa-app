// ContratoAdSucesso — confirmação pós-pagamento do contrato AD.
// Rota: /contrato-ad/:token/sucesso

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/Button";
import { useAdContractByToken } from "@/hooks/useAdContractSignup";
import { formatBRL } from "@/lib/utils";

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

export default function ContratoAdSucesso() {
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading } = useAdContractByToken(token);

  const dates = useMemo(() => {
    if (!contract) return null;
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + getPeriodMonths(contract.period));
    return {
      start: start.toLocaleDateString("pt-BR"),
      end: end.toLocaleDateString("pt-BR"),
    };
  }, [contract]);

  if (isLoading) return <Loader />;

  const typeLabel = contract?.contract_type === "banner" ? "banner" : "parceria";
  const typeTitle =
    contract?.contract_type === "banner" ? "Banner publicitário" : "Parceria";

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="hv-card p-7 max-w-sm w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-4 animate-pulse-ring">
          <HVIcon name="check" size={42} stroke={2.6} color="hsl(var(--hv-leaf))" />
        </div>
        <div className="hv-eyebrow">MAHALO!</div>
        <h1 className="font-display text-[24px] mt-1 leading-tight">
          {contract ? `Seu ${typeLabel} foi ativado!` : "Contrato ativado!"}
        </h1>
        <p className="text-[13px] text-hv-text-2 mt-3 leading-[1.5]">
          Recebemos o pagamento. Em breve seu material estará no ar e você receberá um email
          de confirmação.
        </p>

        {contract && (
          <div className="mt-5 space-y-2 text-left">
            <Row label="Tipo" value={typeTitle} />
            <Row label="Período" value={getPeriodLabel(contract.period)} />
            <Row label="Valor" value={formatBRL(contract.amount_cents)} />
            {dates && (
              <>
                <Row label="Início" value={dates.start} />
                <Row label="Término" value={dates.end} />
              </>
            )}
          </div>
        )}

        <Button
          onClick={() => {
            window.location.href = "https://hipvaa.com.br";
          }}
          variant="accent"
          size="lg"
          className="w-full mt-6"
        >
          Voltar ao site Hip Va'a
          <HVIcon name="arrow-right" size={16} stroke={2.4} />
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-hv-bg rounded-[10px] px-3 py-2">
      <span className="hv-mono text-[10px] tracking-[0.18em] text-hv-text-3">
        {label.toUpperCase()}
      </span>
      <span className="text-[13px] font-semibold text-hv-text">{value}</span>
    </div>
  );
}
