// useDropInSignup — fluxo público de drop-in (aula avulsa).
// Inclui também a versão grátis (Wave 3 parte B) + scheduling.

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

export interface FreeDropInResult {
  success: boolean;
  /** ID gerado em drop_in_students. Backend retorna `drop_in_id`; expomos como
   * `drop_in_student_id` (mais explícito) preservando o original para compat. */
  drop_in_id: string;
  drop_in_student_id: string;
}

export interface ScheduleDropInPayload {
  drop_in_student_id: string;
  class_id: string;
  /** ISO yyyy-mm-dd. Mapeado p/ `class_date` no edge. */
  scheduled_date: string;
}

export interface ScheduleDropInResult {
  success: boolean;
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

/** Cria drop-in grátis (sem PIX). Edge `create-free-drop-in` insere direto
 * em `drop_in_students` com `amount_paid_cents=0` e retorna `drop_in_id`. */
export function useCreateFreeDropIn() {
  return useMutation({
    mutationFn: async (payload: DropInSignupPayload): Promise<FreeDropInResult> => {
      const { data, error } = await supabase.functions.invoke("create-free-drop-in", {
        body: payload,
      });
      if (error) throw new Error(error.message || "Erro ao processar cadastro");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao processar cadastro");
      const id = (data.drop_in_id ?? data.drop_in_student_id) as string;
      if (!id) throw new Error("Resposta inesperada da função");
      return {
        success: true,
        drop_in_id: id,
        drop_in_student_id: id,
      };
    },
    onError: (err: Error) => {
      console.error("createFreeDropIn", err);
      toast.error(err.message || "Erro no cadastro avulso");
    },
  });
}

/** Agenda um drop-in já criado a uma aula+data. Edge `schedule-drop-in`
 * espera `{ drop_in_id, class_id, class_date }` — mapeamos aqui. */
export function useScheduleDropIn() {
  return useMutation({
    mutationFn: async (payload: ScheduleDropInPayload): Promise<ScheduleDropInResult> => {
      const { data, error } = await supabase.functions.invoke("schedule-drop-in", {
        body: {
          drop_in_id: payload.drop_in_student_id,
          class_id: payload.class_id,
          class_date: payload.scheduled_date,
        },
      });
      if (error) throw new Error(error.message || "Erro ao agendar aula");
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Erro ao agendar aula");
      return { success: true };
    },
    onError: (err: Error) => {
      console.error("scheduleDropIn", err);
      toast.error(err.message || "Erro ao agendar aula");
    },
  });
}
