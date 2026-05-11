// usePublicSignup — cria pending signup + gera PIX. Chama edges do Supabase.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface PendingSignupPayload {
  tenant_id: string;
  email: string;
  full_name: string;
  nickname?: string | null;
  cpf: string;
  birthdate: string; // ISO yyyy-mm-dd
  phone: string;
  address: string;
  postal_code: string;
  address_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  can_swim: boolean;
  medical_notes?: string | null;
  gender: string;
  plan_id: string;
  password: string;
}

export interface SignupPaymentResult {
  success: boolean;
  pending_signup_id: string;
  amount_cents: number;
  signup_fee_cents: number;
  price_cents: number;
  plan_name: string;
  expires_at?: string;
}

export interface SignupPixResult {
  success: boolean;
  pix_qr: string;
  pix_qr_base64: string;
  expires_at: string;
}

export function useCreatePendingSignup() {
  return useMutation({
    mutationFn: async (payload: PendingSignupPayload): Promise<SignupPaymentResult> => {
      const { data, error } = await supabase.functions.invoke("create-pending-signup", {
        body: payload,
      });
      if (error) throw new Error(error.message || "Erro ao processar cadastro");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao processar cadastro");
      return data as SignupPaymentResult;
    },
    onError: (err: Error) => {
      console.error("createPendingSignup", err);
      toast.error(err.message || "Erro no cadastro");
    },
  });
}

export function useGenerateSignupPix() {
  return useMutation({
    mutationFn: async ({ pendingSignupId }: { pendingSignupId: string }): Promise<SignupPixResult> => {
      const { data, error } = await supabase.functions.invoke("generate-signup-pix", {
        body: { pending_signup_id: pendingSignupId },
      });
      if (error) throw new Error(error.message || "Erro ao gerar PIX");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao gerar PIX");
      return data as SignupPixResult;
    },
    onError: (err: Error) => {
      console.error("generateSignupPix", err);
      toast.error(err.message || "Erro ao gerar PIX");
    },
  });
}

export interface FreeSignupResult {
  success: boolean;
  user_id: string;
  student_id: string;
  message?: string;
}

/** Cadastro grátis (Wave 3). Cria auth user + student direto (sem PIX) via
 * edge `create-free-signup`. Espera `plan_id` opcional do plano gratuito. */
export function useCreateFreeSignup() {
  return useMutation({
    mutationFn: async (payload: PendingSignupPayload): Promise<FreeSignupResult> => {
      const { data, error } = await supabase.functions.invoke("create-free-signup", {
        body: payload,
      });
      if (error) throw new Error(error.message || "Erro ao processar cadastro");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao processar cadastro");
      return data as FreeSignupResult;
    },
    onError: (err: Error) => {
      console.error("createFreeSignup", err);
      toast.error(err.message || "Erro no cadastro");
    },
  });
}
