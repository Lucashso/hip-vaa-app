// useInvoicePix — gera PIX para fatura/pedido pendente + polling de status.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface PixData {
  pix_qr: string | null;
  pix_qr_base64: string | null;
  pix_expires_at: string | null;
}

/**
 * Gera PIX pra uma fatura pendente do aluno via edge generate-pending-pix.
 * Aceita também order_id (gera pra invoice associada).
 */
export function useGenerateInvoicePix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { invoice_id?: string; order_id?: string }) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-pending-pix",
        { body: payload },
      );
      if (error) {
        // Fallback pra generate-receivable-pix se necessário.
        if (payload.invoice_id) {
          const fb = await supabase.functions.invoke(
            "generate-receivable-pix",
            { body: { invoice_id: payload.invoice_id } },
          );
          if (fb.error) throw fb.error;
          return fb.data as PixData;
        }
        throw error;
      }
      return data as PixData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
      qc.invalidateQueries({ queryKey: ["upcoming-student-invoice"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: Error) => {
      console.error("generate-pending-pix", err);
      toast.error(err.message || "Erro ao gerar PIX");
    },
  });
}

/**
 * Polling do status de uma fatura. Retorna paid quando paid_at != null.
 * Usar enabled=true só enquanto modal estiver aberto.
 */
export function useInvoiceStatusPolling(invoiceId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["invoice-status", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, paid_at")
        .eq("id", invoiceId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string; paid_at: string | null } | null;
    },
    enabled: enabled && !!invoiceId,
    refetchInterval: enabled ? 5000 : false,
  });
}

/** Polling de status de pedido — busca via invoice associada do order. */
export function useOrderInvoicePolling(orderId: string | null, enabled: boolean) {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !enabled) {
      setInvoiceId(null);
      return;
    }
    let mounted = true;
    supabase
      .from("product_orders")
      .select("invoice_id")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) {
          setInvoiceId((data?.invoice_id as string | undefined) ?? null);
        }
      });
    return () => {
      mounted = false;
    };
  }, [orderId, enabled]);

  return useInvoiceStatusPolling(invoiceId, enabled);
}
