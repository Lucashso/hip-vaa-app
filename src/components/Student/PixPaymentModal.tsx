// PixPaymentModal — modal que gera/exibe PIX da invoice/order + polling de pagamento.

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { HVIcon } from "@/lib/HVIcon";
import { formatBRL } from "@/lib/utils";
import {
  useGenerateInvoicePix,
  useInvoiceStatusPolling,
} from "@/hooks/useInvoicePix";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  amountCents: number;
  description?: string;
  invoiceId?: string | null;
  orderId?: string | null;
  /** Se já existir PIX gerado nessa invoice, passa pra evitar nova geração. */
  initialQr?: string | null;
  initialQrBase64?: string | null;
}

export function PixPaymentModal({
  open,
  onClose,
  amountCents,
  description,
  invoiceId,
  orderId,
  initialQr,
  initialQrBase64,
}: Props) {
  const generate = useGenerateInvoicePix();
  const [qr, setQr] = useState<string | null>(initialQr ?? null);
  const [qrBase64, setQrBase64] = useState<string | null>(initialQrBase64 ?? null);
  const [copied, setCopied] = useState(false);

  // Polling do status da invoice
  const polling = useInvoiceStatusPolling(invoiceId ?? null, open);

  // Quando paga, fecha e mostra toast
  useEffect(() => {
    if (polling.data?.status === "paid" || polling.data?.paid_at) {
      toast.success("Pagamento confirmado!");
      onClose();
    }
  }, [polling.data, onClose]);

  // Gera PIX ao abrir se ainda não tem
  useEffect(() => {
    if (!open) return;
    if (qr || qrBase64) return;
    if (!invoiceId && !orderId) return;
    (async () => {
      try {
        const result = await generate.mutateAsync({
          invoice_id: invoiceId ?? undefined,
          order_id: orderId ?? undefined,
        });
        setQr(result?.pix_qr ?? null);
        setQrBase64(result?.pix_qr_base64 ?? null);
      } catch {
        /* toast já é emitido pelo hook */
      }
    })();
  }, [open, invoiceId, orderId, qr, qrBase64, generate]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setQr(initialQr ?? null);
      setQrBase64(initialQrBase64 ?? null);
      setCopied(false);
    }
  }, [open, initialQr, initialQrBase64]);

  async function handleCopy() {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pagamento PIX"
      subtitle={description || "AGUARDANDO PAGAMENTO"}
      maxWidth={400}
      footer={
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="text-center space-y-3">
        <div className="font-display text-[28px] font-extrabold text-hv-navy">
          {formatBRL(amountCents)}
        </div>

        <div className="mx-auto w-[220px] h-[220px] bg-white rounded-[16px] grid place-items-center overflow-hidden border border-hv-line">
          {generate.isPending ? (
            <div className="text-xs text-hv-text-3 px-3">Gerando QR…</div>
          ) : qrBase64 ? (
            <img
              src={`data:image/png;base64,${qrBase64}`}
              alt="QR Code PIX"
              className="w-full h-full object-contain"
            />
          ) : qr ? (
            <div className="text-[10px] text-hv-text-3 px-3 break-all">
              {qr.slice(0, 60)}…
            </div>
          ) : (
            <div className="text-xs text-hv-text-3 px-3 text-center">
              QR não disponível.
            </div>
          )}
        </div>

        {qr && (
          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-11 rounded-[12px] border border-hv-line bg-hv-surface font-semibold text-sm flex items-center justify-center gap-2"
          >
            <HVIcon name={copied ? "check" : "copy"} size={16} />
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        )}

        <div className="text-[11px] text-hv-text-3">
          Aguardando confirmação automática…
        </div>
      </div>
    </Modal>
  );
}
