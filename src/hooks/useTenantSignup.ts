// useTenantSignup — hooks pra fluxo público de assinatura de tenant (/assinar/*).
// Espelha lemehubapp-main/src/hooks/useTenantSignup.ts.

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface TenantSignupData {
  company_name: string;
  legal_name?: string;
  document_type: "cpf" | "cnpj";
  document: string;
  email: string;
  phone: string;
  responsible_name: string;
  cep?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  platform_plan_id: string;
  amount_cents: number;
  business_template?: string;
}

export interface CreatePendingTenantResult {
  pending_signup_id: string;
  contract_id?: string;
  amount_cents: number;
}

export interface PendingTenantSignup {
  id: string;
  company_name: string;
  legal_name: string | null;
  document_type: string;
  document: string;
  email: string;
  phone: string;
  responsible_name: string;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  platform_plan_id: string | null;
  amount_cents: number;
  status: string;
  expires_at: string;
  contract_signed_at: string | null;
  contract_pdf_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export function useCreatePendingTenant() {
  return useMutation({
    mutationFn: async (data: TenantSignupData): Promise<CreatePendingTenantResult> => {
      const { data: result, error } = await supabase.functions.invoke(
        "create-pending-tenant",
        { body: data },
      );
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result as CreatePendingTenantResult;
    },
    onError: (error: Error) => {
      toast.error("Erro ao iniciar cadastro: " + error.message);
    },
  });
}

export interface SignTenantContractInput {
  pending_signup_id: string;
  signer_name: string;
  signer_cpf?: string;
}

export interface SignTenantContractResult {
  success: boolean;
  signed_at: string;
  contract_pdf_url?: string;
}

export function useSignTenantContract() {
  return useMutation({
    mutationFn: async (
      input: SignTenantContractInput,
    ): Promise<SignTenantContractResult> => {
      const { data: result, error } = await supabase.functions.invoke(
        "sign-tenant-contract",
        { body: input },
      );
      if (error) {
        // Tenta extrair msg real do edge function
        let message = error.message || "Erro desconhecido";
        try {
          const ctx = (error as { context?: { body?: ReadableStream } }).context;
          if (ctx?.body) {
            const reader = ctx.body.getReader?.();
            if (reader) {
              const { value } = await reader.read();
              const text = new TextDecoder().decode(value);
              const parsed = JSON.parse(text);
              if (parsed.error) message = parsed.error;
            }
          }
        } catch {
          // mantém msg original
        }
        throw new Error(message);
      }
      if (result?.error) throw new Error(result.error);
      return result as SignTenantContractResult;
    },
    onSuccess: () => {
      toast.success("Contrato assinado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao assinar contrato: " + error.message);
    },
  });
}

export interface ProcessTenantPaymentInput {
  pending_signup_id: string;
  payment_method: "pix" | "credit_card";
  card_token?: string;
  installments?: number;
}

export interface ProcessTenantPaymentResult {
  success: boolean;
  tenant_id?: string;
  redirect_url?: string;
}

export function useProcessTenantPayment() {
  return useMutation({
    mutationFn: async (
      input: ProcessTenantPaymentInput,
    ): Promise<ProcessTenantPaymentResult> => {
      const { data: result, error } = await supabase.functions.invoke(
        "process-tenant-payment",
        { body: input },
      );
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result as ProcessTenantPaymentResult;
    },
    onError: (error: Error) => {
      toast.error("Erro ao processar pagamento: " + error.message);
    },
  });
}

export interface GenerateTenantPixResult {
  pix_qr: string;
  pix_qr_base64: string;
  expires_at: string;
}

export function useGenerateTenantPix() {
  return useMutation({
    mutationFn: async (input: {
      pending_signup_id: string;
    }): Promise<GenerateTenantPixResult> => {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-tenant-invoice-pix",
        { body: input },
      );
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result as GenerateTenantPixResult;
    },
    onError: (error: Error) => {
      toast.error("Erro ao gerar PIX: " + error.message);
    },
  });
}

export function usePendingTenantByID(id: string | undefined) {
  return useQuery({
    queryKey: ["pending-tenant-signup", id],
    queryFn: async (): Promise<PendingTenantSignup | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pending_tenant_signups")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as PendingTenantSignup | null) ?? null;
    },
    enabled: !!id,
  });
}
