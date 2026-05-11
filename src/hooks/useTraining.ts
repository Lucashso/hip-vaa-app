// useTraining — hooks de execução de sessão de treino.
// Wraps existing useTrainingSession (alias useSessionById) + save/skip + Strava pending.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useTrainingSession, type TrainingExercise, type TrainingSession } from "./useTrainingSessions";

export type { TrainingExercise, TrainingSession };

// ───────────────────── Sessões por tenant (admin) ─────────────────────

export interface TrainingSessionWithStudent extends TrainingSession {
  student_name: string | null;
  student_nickname: string | null;
}

export interface TrainingSessionsByTenantFilters {
  status?: string | null;
  studentId?: string | null;
  from?: string | null;
  to?: string | null;
}

/** Lista todas as sessões de treino de um tenant — para visão admin. */
export function useTrainingSessionsByTenant(
  tenantId?: string | null,
  filters?: TrainingSessionsByTenantFilters,
) {
  return useQuery({
    queryKey: ["training-sessions-tenant", tenantId, filters],
    queryFn: async (): Promise<TrainingSessionWithStudent[]> => {
      if (!tenantId) return [];
      let q = supabase
        .from("training_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("session_date", { ascending: false })
        .limit(100);

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.studentId) q = q.eq("student_id", filters.studentId);
      if (filters?.from) q = q.gte("session_date", filters.from);
      if (filters?.to) q = q.lte("session_date", filters.to);

      const { data: sessions, error } = await q;
      if (error) throw error;
      if (!sessions || sessions.length === 0) return [];

      // Busca nomes de perfil dos alunos
      const studentIds = [...new Set(sessions.map((s) => s.student_id).filter(Boolean))];
      let nameMap = new Map<string, { full_name: string | null; nickname: string | null }>();

      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, profile:profiles!students_user_id_profiles_fkey(full_name, nickname)")
          .in("id", studentIds);

        type SR = { id: string; profile: { full_name: string | null; nickname: string | null } | { full_name: string | null; nickname: string | null }[] | null };
        ((students ?? []) as unknown as SR[]).forEach((s) => {
          const p = Array.isArray(s.profile) ? s.profile[0] ?? null : s.profile;
          nameMap.set(s.id, { full_name: p?.full_name ?? null, nickname: p?.nickname ?? null });
        });
      }

      return (sessions as TrainingSession[]).map((s) => {
        const p = nameMap.get(s.student_id) ?? { full_name: null, nickname: null };
        return { ...s, student_name: p.full_name, student_nickname: p.nickname };
      });
    },
    enabled: !!tenantId,
  });
}

/** Cria uma nova sessão de treino (INSERT training_sessions). */
export function useCreateTrainingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tenant_id: string;
      student_id: string;
      session_date: string;
      title?: string | null;
      description?: string | null;
      template_id?: string | null;
    }) => {
      const { data: auth } = await supabase.auth.getUser();

      // Se há template, copia os exercícios
      let exercises: Array<Record<string, unknown>> = [];
      if (input.template_id) {
        const { data: tplExercises } = await supabase
          .from("workout_template_exercises")
          .select("*")
          .eq("template_id", input.template_id)
          .order("sort_order", { ascending: true });
        exercises = tplExercises ?? [];
      }

      const { data: session, error } = await supabase
        .from("training_sessions")
        .insert({
          tenant_id: input.tenant_id,
          student_id: input.student_id,
          session_date: input.session_date,
          title: input.title ?? null,
          description: input.description ?? null,
          status: "scheduled",
          coach_id: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      if (exercises.length > 0) {
        const rows = exercises.map((ex, i) => ({
          session_id: session.id,
          exercise_name: ex.exercise_name as string,
          exercise_type: (ex.exercise_type as string) ?? "strength",
          sets: ex.sets as number | null,
          reps: ex.reps as number | null,
          weight_kg: ex.weight_kg as number | null,
          duration_seconds: ex.duration_seconds as number | null,
          distance_meters: ex.distance_meters as number | null,
          target_pace_seconds: ex.target_pace_seconds as number | null,
          rest_seconds: ex.rest_seconds as number | null,
          notes: ex.notes as string | null,
          video_url: ex.video_url as string | null,
          sort_order: i,
        }));
        await supabase.from("training_exercises").insert(rows);
      }

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-sessions-tenant"] });
      qc.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success("Sessão criada");
    },
    onError: (err: Error) => {
      console.error("createTrainingSession error:", err);
      toast.error("Erro ao criar sessão");
    },
  });
}

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
