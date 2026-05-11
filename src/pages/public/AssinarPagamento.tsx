// AssinarPagamento — passo 3/3 do fluxo /assinar.
// Gera PIX e faz polling de paid_at, ou aceita cartão (placeholder).
// Quando confirmado, chama process-tenant-payment pra criar o tenant e navega
// pra /assinar/sucesso.

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { supabase } from "@/lib/supabase";
import {
  useGenerateTenantPix,
  useProcessTenantPayment,
  type GenerateTenantPixResult,
} from "@/hooks/useTenantSignup";
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

export default function AssinarPagamento() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const pendingSignupId = state.pendingSignupId;
  const paymentMethod = state.payment_method ?? "pix";

  const generatePix = useGenerateTenantPix();
  const processPayment = useProcessTenantPayment();

  const [pix, setPix] = useState<GenerateTenantPixResult | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const finalizedRef = useRef(false);

  // Sem state, manda voltar pra /assinar
  useEffect(() => {
    if (!pendingSignupId) {
      toast.error("Sessão de pagamento perdida. Refaça o cadastro.");
      navigate("/assinar", { replace: true });
    }
  }, [pendingSignupId, navigate]);

  // Gera PIX 1x se for PIX
  useEffect(() => {
    if (paymentMethod !== "pix" || !pendingSignupId) return;
    let cancelled = false;
    generatePix
      .mutateAsync({ pending_signup_id: pendingSignupId })
      .then((res) => {
        if (cancelled) return;
        setPix(res);
      })
      .catch(() => {
        if (cancelled) return;
        setPixError("Não conseguimos gerar o PIX. Tente novamente.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSignupId, paymentMethod]);

  // Countdown
  useEffect(() => {
    if (!pix?.expires_at) return;
    const tick = () => {
      const diff = new Date(pix.expires_at).getTime() - Date.now();
      setCountdown(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [pix]);

  // Polling de paid_at quando PIX gerado
  useEffect(() => {
    if (paymentMethod !== "pix" || !pendingSignupId || !pix) return;
    if (finalizedRef.current) return;

    const tick = async () => {
      if (finalizedRef.current) return;
      const { data } = await supabase
        .from("pending_tenant_signups")
        .select("status, paid_at")
        .eq("id", pendingSignupId)
        .maybeSingle();

      if (
        data &&
        (data.paid_at ||
          data.status === "paid" ||
          data.status === "completed" ||
          data.status === "active")
      ) {
        finalizedRef.current = true;
        await finalize("pix");
      }
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSignupId, pix, paymentMethod]);

  const finalize = async (
    method: "pix" | "credit_card",
    cardToken?: string,
  ) => {
    if (!pendingSignupId) return;
    setProcessing(true);
    try {
      const res = await processPayment.mutateAsync({
        pending_signup_id: pendingSignupId,
        payment_method: method,
        card_token: cardToken,
      });
      navigate("/assinar/sucesso", {
        state: {
          tenant_id: res.tenant_id,
          company_name: state.company_name,
          planName: state.planName,
        },
        replace: true,
      });
    } catch {
      finalizedRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!pix?.pix_qr) return;
    try {
      await navigator.clipboard.writeText(pix.pix_qr);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleCardSubmit = async () => {
    // Placeholder enquanto tokenization não está plugada
    if (!pendingSignupId) return;
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    await finalize("credit_card");
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-4 pb-3.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={processing}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center disabled:opacity-50"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.16em] mt-3">
          PASSO 3 / 3 · PAGAMENTO
        </div>
        <h1 className="font-display text-[26px] mt-1">Quase lá</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          {paymentMethod === "pix"
            ? "Pague o PIX abaixo para abrirmos sua filial."
            : "Preencha os dados do cartão para abrirmos sua filial."}
          {state.planName ? ` Plano ${state.planName}.` : ""}
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        <div className="max-w-[480px] mx-auto space-y-4">
          {processing && (
            <div className="hv-card p-6 flex flex-col items-center gap-3">
              <Loader />
              <div className="text-sm text-hv-text-2">
                Criando sua filial…
              </div>
            </div>
          )}

          {!processing && paymentMethod === "pix" && (
            <>
              {pixError ? (
                <div className="hv-card p-6 text-center text-sm text-hv-coral">
                  {pixError}
                </div>
              ) : !pix ? (
                <div className="hv-card p-8 flex flex-col items-center gap-3">
                  <Loader />
                  <div className="text-sm text-hv-text-2">Gerando seu PIX…</div>
                </div>
              ) : (
                <div className="hv-card p-5 text-center space-y-4">
                  {state.amountCents != null && (
                    <div className="font-display text-[28px] font-extrabold text-hv-navy">
                      {formatBRL(state.amountCents)}
                    </div>
                  )}
                  <div className="mx-auto w-[220px] h-[220px] bg-white rounded-[16px] grid place-items-center overflow-hidden border border-hv-line">
                    {pix.pix_qr_base64 ? (
                      <img
                        src={`data:image/png;base64,${pix.pix_qr_base64}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-hv-text-3 px-3">
                        Use o código copia-e-cola abaixo
                      </div>
                    )}
                  </div>
                  {countdown != null && countdown > 0 && (
                    <div className="hv-mono text-[12px] text-hv-text-3 tracking-wider">
                      EXPIRA EM {formatCountdown(countdown)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full h-11 rounded-[12px] border border-hv-line bg-hv-surface font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <HVIcon name={copied ? "check" : "copy"} size={16} />
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                  <div className="text-[12px] text-hv-text-3">
                    Assim que confirmarmos, sua filial é criada e você é
                    redirecionado.
                  </div>
                </div>
              )}
            </>
          )}

          {!processing && paymentMethod === "credit_card" && (
            <div className="hv-card p-5 space-y-3">
              {state.amountCents != null && (
                <div className="font-display text-[24px] font-extrabold text-hv-navy text-center">
                  {formatBRL(state.amountCents)}
                </div>
              )}
              <div className="text-[12px] text-hv-text-3 text-center">
                Integração com cartão em breve. Pode prosseguir e nossa equipe
                entra em contato pra confirmar.
              </div>
              <CardField label="Número do cartão" placeholder="0000 0000 0000 0000" />
              <div className="grid grid-cols-2 gap-2">
                <CardField label="Validade" placeholder="MM/AA" />
                <CardField label="CVV" placeholder="000" />
              </div>
              <CardField label="Nome no cartão" placeholder="Como impresso" />
              <button
                type="button"
                onClick={handleCardSubmit}
                disabled={processPayment.isPending}
                className={cn(
                  "w-full mt-2 h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50",
                )}
              >
                {processPayment.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processando…
                  </>
                ) : (
                  <>
                    Confirmar pagamento
                    <HVIcon name="arrow-right" size={16} stroke={2.4} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardField({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
        {label}
      </label>
      <input
        type="text"
        className="w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy mt-1.5"
        placeholder={placeholder}
        disabled
      />
    </div>
  );
}
