// ContratoAdPagamento — passo 3 do fluxo de contrato AD.
// Rota: /contrato-ad/:token/pagamento
// Gera PIX via edge `generate-ad-contract-pix`, mostra QR + copy + polling.
// Quando o contrato fica `completed` (ou `paid_at` not null), redireciona p/ sucesso.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase";
import {
  useAdContractByToken,
  useGenerateAdContractPix,
} from "@/hooks/useAdContractSignup";
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

interface PixData {
  pix_code: string;
  pix_qr_base64: string;
  pix_expires_at?: string;
}

function useCountdown(target: string | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "Expirado";
  const totalSec = Math.floor(diff / 1000);
  const mm = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ContratoAdPagamento() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading, error, refetch } = useAdContractByToken(token);
  const generatePix = useGenerateAdContractPix();

  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Roteamento auto baseado em status
  useEffect(() => {
    if (!contract || !token) return;
    if (contract.status === "pending") {
      navigate(`/contrato-ad/${token}/cadastro`, { replace: true });
    } else if (contract.status === "data_filled") {
      navigate(`/contrato-ad/${token}/contrato`, { replace: true });
    } else if (contract.status === "completed" || contract.paid_at) {
      navigate(`/contrato-ad/${token}/sucesso`, { replace: true });
    }
  }, [contract, token, navigate]);

  // Reusar PIX que já está no contrato se existir
  useEffect(() => {
    if (!contract) return;
    if (contract.pix_code && contract.pix_qr_base64 && !pix) {
      setPix({
        pix_code: contract.pix_code,
        pix_qr_base64: contract.pix_qr_base64,
        pix_expires_at: contract.pix_expires_at ?? undefined,
      });
      setHasGenerated(true);
    }
  }, [contract, pix]);

  // Gerar PIX automaticamente se ainda não tem
  useEffect(() => {
    if (!contract || !token) return;
    if (contract.status !== "contract_signed") return;
    if (pix || hasGenerated || generatePix.isPending) return;

    setHasGenerated(true);
    let cancelled = false;
    generatePix
      .mutateAsync({ token })
      .then((res) => {
        if (cancelled || !res) return;
        if (!res.pix_code || !res.pix_qr_base64) {
          setPixError("Resposta de PIX inválida do servidor.");
          return;
        }
        setPix({
          pix_code: res.pix_code,
          pix_qr_base64: res.pix_qr_base64,
          pix_expires_at: res.pix_expires_at,
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setPixError(err.message || "Não foi possível gerar o PIX.");
      });
    return () => {
      cancelled = true;
    };
  }, [contract, token, pix, hasGenerated, generatePix]);

  // Polling do status do contrato
  useEffect(() => {
    if (!token || paid) return;
    let cancelled = false;
    const tick = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("pending_ad_contracts") as any)
          .select("status, paid_at")
          .eq("token", token)
          .maybeSingle();
        if (cancelled) return;
        if (data && (data.status === "completed" || data.paid_at)) {
          setPaid(true);
          await refetch();
          navigate(`/contrato-ad/${token}/sucesso`, { replace: true });
        }
      } catch {
        // tabela pode não existir — ignora
      }
    };
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, paid, navigate, refetch]);

  const countdown = useCountdown(pix?.pix_expires_at);

  const handleCopy = async () => {
    if (!pix?.pix_code) return;
    try {
      await navigator.clipboard.writeText(pix.pix_code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const qrSrc = useMemo(() => {
    if (!pix?.pix_qr_base64) return null;
    return pix.pix_qr_base64.startsWith("data:")
      ? pix.pix_qr_base64
      : `data:image/png;base64,${pix.pix_qr_base64}`;
  }, [pix?.pix_qr_base64]);

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

  if (contract.status === "pending" || contract.status === "data_filled") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-4 pb-3.5">
        <button
          type="button"
          onClick={() => navigate(`/contrato-ad/${token}/contrato`)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <h1 className="font-display text-[26px] mt-3">Pagamento do contrato</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          {contract.contract_type === "banner" ? "Banner publicitário" : "Parceria"} •{" "}
          {getPeriodLabel(contract.period)}
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        <div className="max-w-md mx-auto space-y-4">
          {pixError ? (
            <div className="hv-card p-6 text-center space-y-3">
              <div className="text-sm text-hv-coral">{pixError}</div>
              <Button
                onClick={() => {
                  setPixError(null);
                  setPix(null);
                  setHasGenerated(false);
                }}
                variant="primary"
                size="default"
              >
                Tentar novamente
              </Button>
            </div>
          ) : paid ? (
            <div className="hv-card p-8 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-hv-foam grid place-items-center">
                <HVIcon name="check" size={28} stroke={2.4} color="hsl(var(--hv-leaf))" />
              </div>
              <div className="font-display text-[20px]">Pagamento confirmado!</div>
              <div className="text-sm text-hv-text-2">Ativando seu contrato…</div>
            </div>
          ) : !pix ? (
            <div className="hv-card p-8 flex flex-col items-center gap-3">
              <Loader />
              <div className="text-sm text-hv-text-2">Gerando seu PIX…</div>
            </div>
          ) : (
            <div className="hv-card p-5 text-center space-y-4">
              <div className="font-display text-[28px] font-extrabold text-hv-navy">
                {formatBRL(contract.amount_cents)}
              </div>

              <div className="mx-auto w-[220px] h-[220px] bg-white rounded-[16px] grid place-items-center overflow-hidden border border-hv-line">
                {qrSrc ? (
                  <img src={qrSrc} alt="QR Code PIX" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-hv-text-3">Use o código abaixo</div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full h-11 rounded-[12px] border border-hv-line bg-hv-surface font-semibold text-sm flex items-center justify-center gap-2"
              >
                <HVIcon name={copied ? "check" : "copy"} size={16} />
                {copied ? "Copiado!" : "Copiar código PIX"}
              </button>

              {countdown && (
                <div className="hv-mono text-[11px] text-hv-text-3 tracking-wider">
                  EXPIRA EM {countdown}
                </div>
              )}

              <div className="text-[12px] text-hv-text-3 flex items-center justify-center gap-2">
                <Spinner />
                Aguardando pagamento…
              </div>
            </div>
          )}

          <div className="text-center hv-mono text-[10px] tracking-[0.2em] text-hv-text-3">
            PASSO 3 DE 3 · PAGAMENTO
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
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
