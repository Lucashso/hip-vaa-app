// ConverterPagamento — gera PIX, espera pagamento, conclui conversão.
// Rotas: /converter/:token/pagamento e /:slug/converter/:token/pagamento

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase";
import {
  useGenerateConversionPix,
  useCompleteConversion,
  type ConverterAddress,
} from "@/hooks/useConverter";
import { formatBRL } from "@/lib/utils";

interface LocationState {
  token?: string;
  password?: string;
  address?: ConverterAddress;
  amount_cents?: number;
  pending_conversion_id?: string;
  student_name?: string | null;
  tenant_slug?: string | null;
}

export default function ConverterPagamento() {
  const navigate = useNavigate();
  const { token: paramToken, slug } = useParams<{ token: string; slug?: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const generatePix = useGenerateConversionPix();
  const completeConversion = useCompleteConversion();

  const token = state.token ?? paramToken;
  const password = state.password;
  const address = state.address;
  const pendingId = state.pending_conversion_id;

  const [pix, setPix] = useState<{
    pix_qr: string;
    pix_qr_base64: string;
    expires_at?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [completing, setCompleting] = useState(false);
  const completionStartedRef = useRef(false);

  // Redirect back if state missing
  useEffect(() => {
    if (!token || !password || !address) {
      const base = slug ? `/${slug}` : "";
      navigate(`${base}/converter/${paramToken ?? ""}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate PIX once
  useEffect(() => {
    if (!token || pix) return;
    let cancelled = false;
    generatePix
      .mutateAsync({ token })
      .then((res) => {
        if (cancelled || !res) return;
        if (!res.pix_qr || !res.pix_qr_base64) {
          setError("Resposta de PIX inválida do servidor.");
          return;
        }
        setPix({
          pix_qr: res.pix_qr,
          pix_qr_base64: res.pix_qr_base64,
          expires_at: res.expires_at,
        });
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível gerar o PIX. Tente novamente.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Poll status
  useEffect(() => {
    if (!pendingId || paid) return;
    let cancelled = false;
    const tick = async () => {
      const { data } = await supabase
        .from("pending_conversions")
        .select("status, completed_at")
        .eq("id", pendingId)
        .maybeSingle();
      if (cancelled) return;
      if (data && (data.status === "paid" || data.status === "completed" || data.completed_at)) {
        setPaid(true);
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingId, paid]);

  // When paid, complete conversion and go success
  useEffect(() => {
    if (!paid || !token || !password || !address) return;
    if (completionStartedRef.current) return;
    completionStartedRef.current = true;
    setCompleting(true);
    completeConversion.mutate(
      { token, password, address },
      {
        onSuccess: () => {
          const base = slug ? `/${slug}` : "";
          navigate(`${base}/converter/${token}/sucesso`, { replace: true });
        },
        onError: (err: Error) => {
          setError(err.message || "Erro ao concluir cadastro.");
          setCompleting(false);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

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

  if (!token || !password || !address) return <Loader />;

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
        <h1 className="font-display text-[26px] mt-3">Pagamento da conversão</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          {state.student_name ? `${state.student_name}, ` : ""}pague o PIX abaixo para finalizar
          seu cadastro.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {error ? (
          <div className="hv-card p-6 text-center text-sm text-hv-coral space-y-3">
            <div>{error}</div>
            <Button
              onClick={() => {
                setError(null);
                setPix(null);
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
            <div className="text-sm text-hv-text-2">
              {completing ? "Concluindo seu cadastro…" : "Redirecionando…"}
            </div>
          </div>
        ) : !pix ? (
          <div className="hv-card p-8 flex flex-col items-center gap-3">
            <Loader />
            <div className="text-sm text-hv-text-2">Gerando seu PIX…</div>
          </div>
        ) : (
          <div className="hv-card p-5 text-center space-y-4">
            {state.amount_cents != null && (
              <div className="font-display text-[28px] font-extrabold text-hv-navy">
                {formatBRL(state.amount_cents)}
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
            <div className="text-[12px] text-hv-text-3 flex items-center justify-center gap-2">
              <Loader2 />
              Aguardando pagamento…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader2() {
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
