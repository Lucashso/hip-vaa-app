// useDropInStudents — alunos avulsos (drop-in) e mutations relacionadas.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface DropInStudent {
  id: string;
  tenant_id: string;
  full_name: string;
  nickname: string | null;
  cpf: string;
  birthdate: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  can_swim: boolean;
  medical_notes: string | null;
  consent_signed: boolean | null;
  consent_signed_at: string | null;
  consent_pdf_url: string | null;
  consent_protocol: string | null;
  amount_paid_cents: number;
  paid_at: string;
  gateway_ref: string | null;
  converted_to_student_id: string | null;
  converted_at: string | null;
  created_at: string;
  gender: string | null;
  scheduled_class_id: string | null;
  scheduled_class_date: string | null;
  booking_status: string | null;
  postal_code: string | null;
  address_number: string | null;
}

export type DropInFilter = "all" | "pending" | "converted";

interface UseDropInOptions {
  filter?: DropInFilter;
  search?: string;
}

/** Lista de drop-in students do tenant. */
export function useDropInStudents(
  tenantId: string | undefined | null,
  opts: UseDropInOptions = {},
) {
  const { filter = "all", search = "" } = opts;
  return useQuery({
    queryKey: ["drop-in-students", tenantId, filter, search],
    queryFn: async (): Promise<DropInStudent[]> => {
      if (!tenantId) return [];
      let q = supabase
        .from("drop_in_students")
        .select(
          "id, tenant_id, full_name, nickname, cpf, birthdate, phone, email, " +
            "emergency_contact_name, emergency_contact_phone, blood_type, can_swim, " +
            "medical_notes, consent_signed, consent_signed_at, consent_pdf_url, " +
            "consent_protocol, amount_paid_cents, paid_at, gateway_ref, " +
            "converted_to_student_id, converted_at, created_at, gender, " +
            "scheduled_class_id, scheduled_class_date, booking_status, " +
            "postal_code, address_number",
        )
        .eq("tenant_id", tenantId)
        .order("paid_at", { ascending: false })
        .limit(200);

      if (filter === "pending") q = q.is("converted_at", null);
      else if (filter === "converted") q = q.not("converted_at", "is", null);

      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as unknown as DropInStudent[];

      if (search) {
        const term = search.toLowerCase();
        const digits = search.replace(/\D/g, "");
        rows = rows.filter((d) => {
          const name = d.full_name?.toLowerCase() ?? "";
          const email = d.email?.toLowerCase() ?? "";
          const cpf = d.cpf?.replace(/\D/g, "") ?? "";
          const phone = d.phone?.replace(/\D/g, "") ?? "";
          return (
            name.includes(term) ||
            email.includes(term) ||
            (digits && (cpf.includes(digits) || phone.includes(digits)))
          );
        });
      }

      return rows;
    },
    enabled: !!tenantId,
  });
}

/** Detalhe de um drop-in student. */
export function useDropInStudent(id: string | undefined | null) {
  return useQuery({
    queryKey: ["drop-in-student", id],
    queryFn: async (): Promise<DropInStudent | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("drop_in_students")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DropInStudent;
    },
    enabled: !!id,
  });
}

export interface DropInCheckin {
  id: string;
  ts: string;
  method: string;
  class_id: string | null;
  scheduled_class_date: string | null;
  source: string | null;
}

/** Histórico de check-ins associados a um drop-in (via gateway_ref / scheduled_class_*).
 *  Tabela `checkins` não tem coluna drop_in_student_id, então tentamos casar via scheduled_class_id+date
 *  guardando o registro no próprio drop_in_students. Retornamos o booking + tentativa em checkins. */
export function useDropInCheckins(dropInId: string | undefined | null) {
  return useQuery({
    queryKey: ["drop-in-checkins", dropInId],
    queryFn: async (): Promise<DropInCheckin[]> => {
      if (!dropInId) return [];
      // Carrega drop_in row pra obter scheduled_class_id / date.
      const { data: dropIn } = await supabase
        .from("drop_in_students")
        .select("scheduled_class_id, scheduled_class_date, paid_at")
        .eq("id", dropInId)
        .maybeSingle();
      if (!dropIn?.scheduled_class_id || !dropIn?.scheduled_class_date) return [];

      const startISO = `${dropIn.scheduled_class_date}T00:00:00`;
      const endISO = `${dropIn.scheduled_class_date}T23:59:59`;
      const { data, error } = await supabase
        .from("checkins")
        .select("id, ts, method, class_id")
        .eq("class_id", dropIn.scheduled_class_id)
        .gte("ts", startISO)
        .lte("ts", endISO)
        .order("ts", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Array<{ id: string; ts: string; method: string; class_id: string }>).map((c) => ({
        ...c,
        scheduled_class_date: dropIn.scheduled_class_date,
        source: "drop_in",
      }));
    },
    enabled: !!dropInId,
  });
}

export interface ConversionLinkResult {
  success: boolean;
  token: string;
  expires_at: string;
}

/** Gera link de conversão (drop-in → mensalista) via edge create-conversion-link. */
export function useConvertDropInToStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dropInId: string;
      planId: string;
      email: string;
      applyDiscount?: boolean;
    }): Promise<ConversionLinkResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const response = await supabase.functions.invoke("create-conversion-link", {
        body: {
          drop_in_id: input.dropInId,
          plan_id: input.planId,
          email: input.email,
          apply_discount: input.applyDiscount ?? true,
        },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao gerar link");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as ConversionLinkResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drop-in-students"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao gerar link de conversão"),
  });
}
