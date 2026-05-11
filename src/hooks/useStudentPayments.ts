// useStudentPayments — métodos de pagamento salvos do aluno (cartões) + mutations.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface StudentPaymentMethod {
  id: string;
  student_id: string;
  tenant_id: string;
  gateway: string;
  card_token: string;
  card_last_four: string;
  card_brand: string | null;
  card_expiry: string | null;
  card_holder_name: string | null;
  is_default: boolean | null;
  created_at: string;
}

/** Cartões salvos do aluno (mais recentes primeiro). */
export function useStudentPaymentMethods(studentId?: string) {
  return useQuery({
    queryKey: ["student-payment-methods", studentId],
    queryFn: async (): Promise<StudentPaymentMethod[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_payment_methods")
        .select("*")
        .eq("student_id", studentId)
        .order("is_default", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as StudentPaymentMethod[]) ?? [];
    },
    enabled: !!studentId,
  });
}

/** Remove um cartão salvo. */
export function useDeleteStudentPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cartão removido");
      qc.invalidateQueries({ queryKey: ["student-payment-methods"] });
    },
    onError: (err: Error) =>
      toast.error("Erro ao remover cartão: " + err.message),
  });
}

/** Define um cartão como padrão. */
export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      studentId,
    }: {
      id: string;
      studentId: string;
    }) => {
      // Desmarca todos os outros do aluno.
      const { error: clearErr } = await supabase
        .from("student_payment_methods")
        .update({ is_default: false })
        .eq("student_id", studentId);
      if (clearErr) throw clearErr;
      const { error } = await supabase
        .from("student_payment_methods")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cartão definido como padrão");
      qc.invalidateQueries({ queryKey: ["student-payment-methods"] });
    },
    onError: (err: Error) =>
      toast.error("Erro ao salvar: " + err.message),
  });
}
