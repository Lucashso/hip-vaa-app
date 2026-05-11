// CadastroPagamento — gera PIX a partir do pending_signup_id e mostra QR + countdown.
// Polling a cada 5s checa status do pending → quando paid, navega pra /cadastro/sucesso.

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { supabase } from "@/lib/supabase";
import { useGenerateSignupPix } from "@/hooks/usePublicSignup";
import { formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface LocationState {
  pendingSignupId?: string;
  amountCents?: number;
  signupFeeCents?: number;
  priceCents?: number;
  planName?: string;
  tenantName?: string;
  slug?: string;
}

export default function CadastroPagamento() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const generatePix = useGenerateSignupPix();
  const [pix, setPix] = useState<{
    pix_qr: string;
    pix_qr_base64: string;
    expires_at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingSignupId = state.pendingSignupId;

  // Gera PIX 1x
  useEffect(() => {
    if (!pendingSignupId) {
      setError("Sessão de cadastro perdida. Refaça o cadastro.");
      return;
    }
    let cancelled = false;
    generatePix
      .mutateAsync({ pendingSignupId })
      .then((res) => {
        if (cancelled) return;
        setPix({
          pix_qr: res.pix_qr,
          pix_qr_base64: res.pix_qr_base64,
          expires_at: res.expires_at,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não conseguimos gerar o PIX. Tente novamente.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSignupId]);

  // Polling de status
  useEffect(() => {
    if (!pendingSignupId) return;
    const tick = async () => {
      const { data } = await supabase
        .from("pending_signups")
        .select("status, completed_at")
        .eq("id", pendingSignupId)
        .maybeSingle();
      if (data && (data.status === "paid" || data.status === "completed" || data.completed_at)) {
        const target = slug ? `/${slug}/cadastro/sucesso` : "/cadastro/sucesso";
        navigate(target, { replace: true });
      }
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [pendingSignupId, navigate, slug]);

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
          PASSO 3 / 3 · PAGAMENTO
        </div>
        <h1 className="font-display text-[26px] mt-1">Quase lá</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          Pague o PIX abaixo para confirmar sua matrícula
          {state.planName ? ` no plano ${state.planName}` : ""}.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {error ? (
          <div className="hv-card p-6 text-center text-sm text-hv-coral">{error}</div>
        ) : !pix ? (
          <div className="hv-card p-8 flex flex-col items-center gap-3">
            <Loader />
            <div className="text-sm text-hv-text-2">Gerando seu PIX…</div>
          </div>
        ) : (
          <>
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
              <div className="text-[12px] text-hv-text-3">
                Assim que confirmarmos o pagamento, você é redirecionado.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
