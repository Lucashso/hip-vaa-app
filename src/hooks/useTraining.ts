// useTraining — hooks de execução de sessão de treino.
// Wraps existing useTrainingSession (alias useSessionById) + save/skip + Strava pending.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTrainingSession, type TrainingExercise, type TrainingSession } from "./useTrainingSessions";

export type { TrainingExercise, TrainingSession };

/** Alias semântico ao hook que já busca sessão + exercícios. */
export function useSessionById(sessionId?: string) {
  return useTrainingSession(sessionId);
}

interface SaveResultsArgs {
  sessionId: string;
  results: {
    exercises: Array<{
      id: string;
      exercise_name: string;
      completed: boolean;
      sets?: number | null;
      reps?: number | null;
      weight_kg?: number | null;
      distance_meters?: number | null;
      duration_seconds?: number | null;
      pace_seconds?: number | null;
    }>;
    total_time_seconds: number;
    perceived_effort: number | null;
    started_at?: string;
    finished_at?: string;
  };
  studentFeedback?: string | null;
}

/** Salva resultado do treino — status=completed, results_json, student_feedback. */
export function useSaveWorkoutResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, results, studentFeedback }: SaveResultsArgs) => {
      const taggedResults = {
        ...results,
        source: "manual",
        athlete_confirmed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("training_sessions")
        .update({
          status: "completed",
          results_json: taggedResults as never,
          ...(studentFeedback !== undefined && { student_feedback: studentFeedback }),
        })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["training-session", vars.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
    },
  });
}

/** Marca sessão como skipped + grava motivo no student_feedback. */
export function useSkipWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason: string }) => {
      const { error } = await supabase
        .from("training_sessions")
        .update({ status: "skipped", student_feedback: reason || null })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["training-session", vars.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
    },
  });
}

export interface PendingStravaImport {
  id: string;
  strava_activity_id: number;
  activity_data: Record<string, unknown>;
  imported_at: string;
}

/** Importação Strava pendente vinculada à sessão (não confirmada e não dispensada). */
export function usePendingStravaImport(sessionId?: string) {
  return useQuery({
    queryKey: ["strava-pending-import", sessionId],
    queryFn: async (): Promise<PendingStravaImport | null> => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from("strava_pending_imports")
        .select("id, strava_activity_id, activity_data, imported_at")
        .eq("training_session_id", sessionId)
        .is("confirmed_at", null)
        .is("dismissed_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data as PendingStravaImport | null) ?? null;
    },
    enabled: !!sessionId,
  });
}

/** Confirma importação Strava — UPDATE confirmed_at = now(). */
export function useConfirmStravaImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from("strava_pending_imports")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("id", importId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strava-pending-import"] });
    },
  });
}
