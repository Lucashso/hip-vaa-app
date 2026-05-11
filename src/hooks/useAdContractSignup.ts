// useAdContractSignup — fluxo público de contrato AD (banner / parceria).
// Backend (Wave 3 — pending_ad_contracts):
//   - tabela `pending_ad_contracts` (criada via migration depois)
//   - edges: update-ad-contract-data, sign-ad-contract,
//            generate-ad-contract-payment, generate-ad-contract-pix
// Como a tabela ainda não existe, queries podem falhar em runtime — as telas
// caem em empty state "Link inválido ou expirado" quando isso acontece.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type AdContractType = "banner" | "partner";
export type AdContractPeriod = "monthly" | "quarterly" | "semiannual" | "annual";
export type AdContractStatus =
  | "pending"
  | "data_filled"
  | "contract_signed"
  | "completed"
  | "expired"
  | "cancelled";

export interface PendingAdContract {
  id: string;
  token: string;
  contract_type: AdContractType;
  banner_id: string | null;
  partner_id: string | null;
  period: AdContractPeriod | string;
  amount_cents: number;
  payment_method: "all" | "pix" | "credit_card" | null;
  card_payment_type: "one_time" | "installments" | "recurring" | null;
  max_installments: number | null;
  advertiser_name: string | null;
  advertiser_document: string | null;
  advertiser_phone: string | null;
  advertiser_email: string | null;
  status: AdContractStatus | string;
  signed_at: string | null;
  signer_name: string | null;
  signer_cpf: string | null;
  pix_code: string | null;
  pix_qr_base64: string | null;
  pix_expires_at: string | null;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface AdvertiserData {
  advertiser_name: string;
  advertiser_document: string;
  advertiser_phone: string;
  advertiser_email: string;
}

/**
 * Busca contrato AD pendente pelo token. Tenta primeiro via RPC
 * `get_pending_ad_contract_by_token` (caso exista), com fallback para SELECT
 * direto na tabela `pending_ad_contracts`. Qualquer falha vira `null` para que
 * as páginas mostrem empty state "Link inválido ou expirado".
 */
export function useAdContractByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["pending-ad-contract", token],
    queryFn: async (): Promise<PendingAdContract | null> => {
      if (!token) return null;

      // Tentar RPC primeiro (se existir no backend)
      try {
        const rpc = await supabase.rpc("get_pending_ad_contract_by_token", { p_token: token });
        if (!rpc.error && rpc.data) {
          const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
          if (row) return row as PendingAdContract;
        }
      } catch {
        // RPC pode não existir — segue pro fallback
      }

      // Fallback: SELECT direto na tabela
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("pending_ad_contracts") as any)
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error) {
        // Tabela pode ainda não existir — não levanta, deixa a UI mostrar empty state
        console.warn("useAdContractByToken:", error.message);
        return null;
      }
      return (data ?? null) as PendingAdContract | null;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5_000,
  });
}

/** Atualiza dados do anunciante (passo 1 → status `data_filled`). */
export function useUpdateAdContractData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { token: string } & AdvertiserData) => {
      const resp = await supabase.functions.invoke("update-ad-contract-data", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao salvar dados");
      const data = resp.data as { error?: string; success?: boolean } | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pending-ad-contract", vars.token] });
    },
    onError: (err: Error) => {
      console.error("update-ad-contract-data:", err);
      toast.error(err.message || "Erro ao salvar dados");
    },
  });
}

/** Assinatura do contrato (passo 2 → status `contract_signed`). */
export function useSignAdContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { token: string; signer_name: string; signer_cpf?: string }) => {
      const resp = await supabase.functions.invoke("sign-ad-contract", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao assinar contrato");
      const data = resp.data as { error?: string; success?: boolean } | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pending-ad-contract", vars.token] });
    },
    onError: (err: Error) => {
      console.error("sign-ad-contract:", err);
      toast.error(err.message || "Erro ao assinar contrato");
    },
  });
}

/** Gera pagamento genérico (PIX ou cartão) — usado quando ambos métodos disponíveis. */
export function useGenerateAdContractPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      token: string;
      payment_method: "pix" | "credit_card";
      card_token?: string;
      installments?: number;
    }) => {
      const resp = await supabase.functions.invoke("generate-ad-contract-payment", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar pagamento");
      const data = resp.data as
        | {
            error?: string;
            success?: boolean;
            pix_code?: string;
            pix_qr_base64?: string;
            pix_expires_at?: string;
          }
        | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pending-ad-contract", vars.token] });
    },
    onError: (err: Error) => {
      console.error("generate-ad-contract-payment:", err);
      toast.error(err.message || "Erro ao gerar pagamento");
    },
  });
}

/** Gera PIX direto (atalho do generate-payment com method=pix). */
export function useGenerateAdContractPix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { token: string }) => {
      const resp = await supabase.functions.invoke("generate-ad-contract-pix", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar PIX");
      const data = resp.data as
        | {
            error?: string;
            success?: boolean;
            pix_code?: string;
            pix_qr_base64?: string;
            pix_expires_at?: string;
          }
        | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pending-ad-contract", vars.token] });
    },
    onError: (err: Error) => {
      console.error("generate-ad-contract-pix:", err);
      toast.error(err.message || "Erro ao gerar PIX");
    },
  });
}
