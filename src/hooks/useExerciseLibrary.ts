// useExerciseLibrary — biblioteca de exercícios do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ExerciseLibraryItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
}

export function useExerciseLibrary(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "exercise-library", tenantId],
    queryFn: async (): Promise<ExerciseLibraryItem[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("exercise_library")
        .select("id, tenant_id, name, description, video_url, muscle_group, exercise_type")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExerciseLibraryItem[];
    },
    enabled: !!tenantId,
  });
}
