// useMyHealthQuestionnaire — questionário de saúde do aluno.
// Verifica se já respondeu e expõe mutation pra salvar respostas customizadas (jsonb).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface HealthQuestionnaire {
  id: string;
  student_id: string;
  tenant_id: string;
  custom_responses: Record<string, unknown> | null;
  answered_at: string | null;
  updated_at: string | null;
}

export function useMyHealthQuestionnaire(studentId?: string) {
  return useQuery({
    queryKey: ["my-health-questionnaire", studentId],
    queryFn: async (): Promise<HealthQuestionnaire | null> => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("health_questionnaires")
        .select(
          "id, student_id, tenant_id, custom_responses, answered_at, updated_at",
        )
        .eq("student_id", studentId)
        .maybeSingle();
      if (error) throw error;
      return (data as HealthQuestionnaire) ?? null;
    },
    enabled: !!studentId,
  });
}

export function useSaveHealthQuestionnaire() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async ({
      studentId,
      answers,
    }: {
      studentId: string;
      answers: Record<string, unknown>;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const nowIso = new Date().toISOString();

      // Verifica se já existe.
      const { data: existing, error: selErr } = await supabase
        .from("health_questionnaires")
        .select("id")
        .eq("student_id", studentId)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing?.id) {
        const { error } = await supabase
          .from("health_questionnaires")
          .update({
            custom_responses: answers,
            answered_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("health_questionnaires").insert({
          student_id: studentId,
          tenant_id: profile.tenant_id,
          custom_responses: answers,
          answered_at: nowIso,
        });
        if (error) throw error;
      }

      // Marca flag no students.
      await supabase
        .from("students")
        .update({ health_questionnaire_answered: true })
        .eq("id", studentId);
    },
    onSuccess: () => {
      toast.success("Questionário salvo!");
      qc.invalidateQueries({ queryKey: ["my-health-questionnaire"] });
      qc.invalidateQueries({ queryKey: ["my-student"] });
    },
    onError: (err: Error) =>
      toast.error("Erro ao salvar questionário: " + err.message),
  });
}
