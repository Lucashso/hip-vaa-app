// Hooks de sessões de treino seco do aluno.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TrainingSession {
  id: string;
  student_id: string;
  coach_id: string | null;
  tenant_id: string;
  session_date: string;
  title: string | null;
  description: string | null;
  status: string | null;
  strava_activity_id: string | null;
  results_json: Record<string, unknown> | null;
  student_feedback: string | null;
  created_at: string;
}

export interface TrainingExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  distance_meters: number | null;
  target_pace_seconds: number | null;
  notes: string | null;
  video_url: string | null;
  sort_order: number | null;
  exercise_type: string | null;
}

/** Sessões de treino do aluno. */
export function useTrainingSessions(studentId?: string) {
  return useQuery({
    queryKey: ["training-sessions", studentId],
    queryFn: async (): Promise<TrainingSession[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("student_id", studentId)
        .order("session_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as TrainingSession[]) ?? [];
    },
    enabled: !!studentId,
  });
}

/** Sessão específica + exercícios. */
export function useTrainingSession(sessionId?: string) {
  return useQuery({
    queryKey: ["training-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data: session, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      if (!session) return null;
      const { data: exercises, error: errEx } = await supabase
        .from("training_exercises")
        .select("*")
        .eq("session_id", sessionId)
        .order("sort_order", { ascending: true });
      if (errEx) throw errEx;
      return {
        session: session as TrainingSession,
        exercises: (exercises as TrainingExercise[]) ?? [],
      };
    },
    enabled: !!sessionId,
  });
}
