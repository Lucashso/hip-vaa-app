// AvulsoPagamento — gera PIX via generate-drop-in-pix e mostra QR + polling.
// Rota: /avulso/pagamento ou /:slug/avulso/pagamento

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { supabase } from "@/lib/supabase";
import { useGenerateDropInPix } from "@/hooks/useDropInSignup";
import { formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface LocationState {
  pendingDropInId?: string;
  amountCents?: number;
  tenantName?: string;
  slug?: string;
}

export default function AvulsoPagamento() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const generatePix = useGenerateDropInPix();

  const [pix, setPix] = useState<{
    pix_qr: string;
    pix_qr_base64: string;
    expires_at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingDropInId = state.pendingDropInId;

  useEffect(() => {
    if (!pendingDropInId) {
      setError("Sessão de cadastro perdida. Refaça o avulso.");
      return;
    }
    let cancelled = false;
    generatePix
      .mutateAsync({ pendingDropInId })
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
        setError("Não conseguimos gerar o PIX.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDropInId]);

  useEffect(() => {
    if (!pendingDropInId) return;
    const tick = async () => {
      const { data } = await supabase
        .from("pending_drop_in_signups")
        .select("status, completed_at")
        .eq("id", pendingDropInId)
        .maybeSingle();
      if (data && (data.status === "paid" || data.status === "completed" || data.completed_at)) {
        const target = slug ? `/${slug}/avulso/sucesso` : "/avulso/sucesso";
        navigate(target, { replace: true });
      }
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [pendingDropInId, navigate, slug]);

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
        <h1 className="font-display text-[26px] mt-3">Pagamento avulso</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5">
          Pague o PIX abaixo. Assim que confirmarmos, sua reserva é liberada.
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
          </div>
        )}
      </div>
    </div>
  );
}
