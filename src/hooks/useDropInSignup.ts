// useDropInSignup — fluxo público de drop-in (aula avulsa).

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface DropInSignupPayload {
  tenant_id: string;
  email: string;
  full_name: string;
  nickname?: string | null;
  cpf: string;
  birthdate: string;
  phone: string;
  postal_code?: string;
  address_number?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  can_swim: boolean;
  medical_notes?: string | null;
  gender: string;
}

export interface DropInPendingResult {
  success: boolean;
  pending_drop_in_id: string;
  amount_cents: number;
  expires_at?: string;
}

export interface DropInPixResult {
  success: boolean;
  pix_qr: string;
  pix_qr_base64: string;
  expires_at: string;
}

export function useCreatePendingDropIn() {
  return useMutation({
    mutationFn: async (payload: DropInSignupPayload): Promise<DropInPendingResult> => {
      const { data, error } = await supabase.functions.invoke("create-pending-drop-in", {
        body: payload,
      });
      if (error) throw new Error(error.message || "Erro ao processar cadastro");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao processar cadastro");
      return data as DropInPendingResult;
    },
    onError: (err: Error) => {
      console.error("createPendingDropIn", err);
      toast.error(err.message || "Erro no cadastro avulso");
    },
  });
}

export function useGenerateDropInPix() {
  return useMutation({
    mutationFn: async ({ pendingDropInId }: { pendingDropInId: string }): Promise<DropInPixResult> => {
      const { data, error } = await supabase.functions.invoke("generate-drop-in-pix", {
        body: { pending_drop_in_id: pendingDropInId },
      });
      if (error) throw new Error(error.message || "Erro ao gerar PIX");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao gerar PIX");
      return data as DropInPixResult;
    },
    onError: (err: Error) => {
      console.error("generateDropInPix", err);
      toast.error(err.message || "Erro ao gerar PIX");
    },
  });
}
