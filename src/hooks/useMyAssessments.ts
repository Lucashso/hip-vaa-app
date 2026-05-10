// Hooks de avaliações físicas do aluno.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PhysicalAssessment {
  id: string;
  student_id: string;
  tenant_id: string;
  assessed_by: string | null;
  assessed_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  vo2max: number | null;
  resting_hr: number | null;
  notes: string | null;
  measurements_json: Record<string, unknown> | null;
  created_at: string;
}

/** Avaliações físicas do aluno (mais recente primeiro). */
export function useMyAssessments(studentId?: string) {
  return useQuery({
    queryKey: ["my-assessments", studentId],
    queryFn: async (): Promise<PhysicalAssessment[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("physical_assessments")
        .select("*")
        .eq("student_id", studentId)
        .order("assessed_at", { ascending: false });
      if (error) throw error;
      return (data as PhysicalAssessment[]) ?? [];
    },
    enabled: !!studentId,
  });
}
