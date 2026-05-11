// useWorkoutLibrary — CRUD de workout_templates + workout_template_exercises + exercise_library.
// Backend: tabelas idem com tenant_id scoped via RLS.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ───────────────────── Workout templates ─────────────────────

export interface WorkoutTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string | null;
  exercise_count: number;
}

export function useWorkoutTemplates(tenantId?: string | null) {
  return useQuery({
    queryKey: ["workout-templates", tenantId],
    queryFn: async (): Promise<WorkoutTemplate[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("workout_templates")
        .select(
          "id, tenant_id, name, description, created_by, created_at, workout_template_exercises(count)",
        )
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      type Row = WorkoutTemplate & {
        workout_template_exercises?: { count: number }[];
      };
      return ((data ?? []) as unknown as Row[]).map((t) => ({
        id: t.id,
        tenant_id: t.tenant_id,
        name: t.name,
        description: t.description,
        created_by: t.created_by,
        created_at: t.created_at,
        exercise_count: t.workout_template_exercises?.[0]?.count ?? 0,
      }));
    },
    enabled: !!tenantId,
  });
}

export function useCreateWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenant_id,
      name,
      description,
    }: {
      tenant_id: string;
      name: string;
      description: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("workout_templates")
        .insert({
          tenant_id,
          name,
          description,
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Treino criado");
    },
    onError: (err: Error) => {
      console.error("createWorkoutTemplate error:", err);
      toast.error("Erro ao criar treino");
    },
  });
}

export function useUpdateWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from("workout_templates")
        .update({ name, description })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Treino atualizado");
    },
    onError: (err: Error) => {
      console.error("updateWorkoutTemplate error:", err);
      toast.error("Erro ao atualizar treino");
    },
  });
}

export function useDeleteWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Treino excluído");
    },
    onError: (err: Error) => {
      console.error("deleteWorkoutTemplate error:", err);
      toast.error("Erro ao excluir treino");
    },
  });
}

export function useDuplicateWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchErr } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr || !original) throw fetchErr || new Error("Template não encontrado");

      const { data: auth } = await supabase.auth.getUser();

      const { data: copy, error } = await supabase
        .from("workout_templates")
        .insert({
          tenant_id: original.tenant_id,
          name: `Cópia de ${original.name}`,
          description: original.description,
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const { data: exercises } = await supabase
        .from("workout_template_exercises")
        .select("*")
        .eq("template_id", id)
        .order("sort_order");

      if (exercises && exercises.length > 0) {
        const rows = exercises.map((ex) => ({
          template_id: copy.id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          duration_seconds: ex.duration_seconds,
          notes: ex.notes,
          video_url: ex.video_url,
          sort_order: ex.sort_order,
          exercise_type: ex.exercise_type || "strength",
          rest_seconds: ex.rest_seconds,
          distance_meters: ex.distance_meters,
          target_pace_seconds: ex.target_pace_seconds,
        }));
        await supabase.from("workout_template_exercises").insert(rows);
      }

      return copy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Treino duplicado");
    },
    onError: (err: Error) => {
      console.error("duplicateWorkoutTemplate error:", err);
      toast.error("Erro ao duplicar treino");
    },
  });
}

export interface WorkoutTemplateExercise {
  id?: string;
  template_id?: string;
  exercise_name: string;
  exercise_type: string | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  target_pace_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
  video_url: string | null;
  sort_order: number;
}

export function useWorkoutTemplateExercises(templateId?: string | null) {
  return useQuery({
    queryKey: ["workout-template-exercises", templateId],
    queryFn: async (): Promise<WorkoutTemplateExercise[]> => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from("workout_template_exercises")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WorkoutTemplateExercise[];
    },
    enabled: !!templateId,
  });
}

export function useSaveWorkoutTemplateExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      exercises,
    }: {
      templateId: string;
      exercises: Omit<WorkoutTemplateExercise, "id" | "template_id">[];
    }) => {
      const { error: delErr } = await supabase
        .from("workout_template_exercises")
        .delete()
        .eq("template_id", templateId);
      if (delErr) throw delErr;

      if (exercises.length > 0) {
        const rows = exercises.map((ex, i) => ({
          template_id: templateId,
          exercise_name: ex.exercise_name,
          exercise_type: ex.exercise_type || "strength",
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          duration_seconds: ex.duration_seconds,
          distance_meters: ex.distance_meters,
          target_pace_seconds: ex.target_pace_seconds,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          video_url: ex.video_url,
          sort_order: i,
        }));
        const { error } = await supabase
          .from("workout_template_exercises")
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workout-template-exercises", vars.templateId] });
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Exercícios salvos");
    },
    onError: (err: Error) => {
      console.error("saveWorkoutTemplateExercises error:", err);
      toast.error("Erro ao salvar exercícios");
    },
  });
}

// ───────────────────── Exercise library ─────────────────────

export interface ExerciseLibraryFull {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tenant_id: string;
      name: string;
      description?: string | null;
      video_url?: string | null;
      muscle_group?: string | null;
      exercise_type?: string | null;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("exercise_library")
        .insert({
          tenant_id: input.tenant_id,
          name: input.name,
          description: input.description ?? null,
          video_url: input.video_url ?? null,
          muscle_group: input.muscle_group ?? null,
          exercise_type: input.exercise_type ?? null,
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exercise-library"] });
      toast.success("Exercício criado");
    },
    onError: (err: Error) => {
      console.error("createExercise error:", err);
      toast.error("Erro ao criar exercício");
    },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      video_url?: string | null;
      muscle_group?: string | null;
      exercise_type?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("exercise_library")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exercise-library"] });
      toast.success("Exercício atualizado");
    },
    onError: (err: Error) => {
      console.error("updateExercise error:", err);
      toast.error("Erro ao atualizar exercício");
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercise_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exercise-library"] });
      toast.success("Exercício excluído");
    },
    onError: (err: Error) => {
      console.error("deleteExercise error:", err);
      toast.error("Erro ao excluir exercício");
    },
  });
}
