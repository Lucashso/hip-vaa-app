// useCheckins — leitura e mutations de check-ins do aluno.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CheckinRow {
  id: string;
  student_id: string | null;
  class_id: string;
  ts: string;
  method: string;
  geo_ok: boolean | null;
}

function todayRange(): { startIso: string; endIso: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** Check-ins do aluno feitos hoje (0:00 → 24:00 local). */
export function useTodayCheckins(studentId?: string) {
  return useQuery({
    queryKey: ["today-checkins", studentId],
    queryFn: async (): Promise<CheckinRow[]> => {
      if (!studentId) return [];
      const { startIso, endIso } = todayRange();
      const { data, error } = await supabase
        .from("checkins")
        .select("id, student_id, class_id, ts, method, geo_ok")
        .eq("student_id", studentId)
        .gte("ts", startIso)
        .lt("ts", endIso);
      if (error) throw error;
      return (data as CheckinRow[]) ?? [];
    },
    enabled: !!studentId,
  });
}

/** Cria check-in para uma aula. Dedupe via SELECT antes. */
export function useCreateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const { startIso, endIso } = todayRange();

      // Dedupe — verifica se já tem check-in nessa aula hoje.
      const { data: existing, error: selErr } = await supabase
        .from("checkins")
        .select("id")
        .eq("student_id", studentId)
        .eq("class_id", classId)
        .gte("ts", startIso)
        .lt("ts", endIso)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) return existing;

      const { data, error } = await supabase
        .from("checkins")
        .insert({
          student_id: studentId,
          class_id: classId,
          ts: new Date().toISOString(),
          method: "manual",
          geo_ok: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Check-in confirmado!");
      qc.invalidateQueries({ queryKey: ["today-checkins"] });
      qc.invalidateQueries({ queryKey: ["my-monthly-checkins"] });
    },
    onError: (err: Error) => {
      console.error("createCheckin", err);
      toast.error(err.message || "Erro ao fazer check-in");
    },
  });
}

/** Remove um check-in pelo id. */
export function useDeleteCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkinId: string) => {
      const { error } = await supabase.from("checkins").delete().eq("id", checkinId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-in cancelado");
      qc.invalidateQueries({ queryKey: ["today-checkins"] });
      qc.invalidateQueries({ queryKey: ["my-monthly-checkins"] });
    },
    onError: (err: Error) => {
      console.error("deleteCheckin", err);
      toast.error(err.message || "Erro ao cancelar check-in");
    },
  });
}
