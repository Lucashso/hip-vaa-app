// useConverter — hooks do fluxo de conversão (drop-in → mensalista).
// Backend edges: complete-conversion, generate-conversion-pix.

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface PendingConversion {
  id: string;
  tenant_id: string;
  drop_in_student_id: string;
  token: string;
  plan_id: string;
  apply_discount: boolean | null;
  email: string;
  address: string | null;
  amount_cents: number | null;
  pix_qr: string | null;
  pix_qr_base64: string | null;
  gateway_ref: string | null;
  status: string | null;
  expires_at: string;
  completed_at: string | null;
  created_at: string | null;
  drop_in_student?: {
    full_name: string;
    nickname: string | null;
    cpf: string;
    phone: string;
    email: string;
    amount_paid_cents: number;
    postal_code: string | null;
    address_number: string | null;
  } | null;
  plan?: {
    name: string;
    price_cents: number;
    signup_fee_cents: number | null;
  } | null;
  tenant?: {
    name: string;
    contract_text: string | null;
    drop_in_contract_text: string | null;
    app_url: string | null;
    slug: string | null;
    domain: string | null;
  } | null;
}

/** Busca conversão pendente pelo token, com joins. */
export function useConversionByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["conversion-by-token", token],
    queryFn: async (): Promise<PendingConversion | null> => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("pending_conversions")
        .select(
          `*,
          drop_in_student:drop_in_students(
            full_name, nickname, cpf, phone, email, amount_paid_cents,
            postal_code, address_number
          ),
          plan:plans(name, price_cents, signup_fee_cents),
          tenant:tenants(name, contract_text, drop_in_contract_text, app_url, slug, domain)`,
        )
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      type Row = Omit<PendingConversion, "drop_in_student" | "plan" | "tenant"> & {
        drop_in_student: PendingConversion["drop_in_student"] | NonNullable<PendingConversion["drop_in_student"]>[] | null;
        plan: PendingConversion["plan"] | NonNullable<PendingConversion["plan"]>[] | null;
        tenant: PendingConversion["tenant"] | NonNullable<PendingConversion["tenant"]>[] | null;
      };
      const row = data as unknown as Row;
      return {
        ...row,
        drop_in_student: Array.isArray(row.drop_in_student)
          ? row.drop_in_student[0] ?? null
          : row.drop_in_student ?? null,
        plan: Array.isArray(row.plan) ? row.plan[0] ?? null : row.plan ?? null,
        tenant: Array.isArray(row.tenant) ? row.tenant[0] ?? null : row.tenant ?? null,
      };
    },
    enabled: !!token,
  });
}

export interface ConverterAddress {
  postal_code: string;
  address: string;
  address_number: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

/** Completa conversão: edge complete-conversion. */
export function useCompleteConversion() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string; address: ConverterAddress }) => {
      const resp = await supabase.functions.invoke("complete-conversion", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao completar conversão");
      const data = resp.data as { error?: string; success?: boolean } | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onError: (err: Error) => {
      console.error("complete-conversion:", err);
      toast.error(err.message || "Erro ao concluir cadastro");
    },
  });
}

/** Gera PIX para conversão paga: edge generate-conversion-pix. */
export function useGenerateConversionPix() {
  return useMutation({
    mutationFn: async (payload: { token: string }) => {
      const resp = await supabase.functions.invoke("generate-conversion-pix", { body: payload });
      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar PIX");
      const data = resp.data as {
        error?: string;
        pix_qr?: string;
        pix_qr_base64?: string;
        expires_at?: string;
        pending_conversion_id?: string;
      } | null;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onError: (err: Error) => {
      console.error("generate-conversion-pix:", err);
      toast.error(err.message || "Erro ao gerar PIX");
    },
  });
}
