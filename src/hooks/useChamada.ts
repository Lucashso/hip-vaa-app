// useChamada — hooks para chamada ao vivo (InstrutorChamada).
// Lista matrículas + checkins do dia + mutations criar/deletar (aluno e avulso).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface EnrollmentWithStudent {
  id: string;
  student_id: string;
  class_id: string;
  active: boolean;
  student: {
    id: string;
    user_id: string;
    status: string;
    profile: {
      full_name: string;
      nickname: string | null;
      photo_url: string | null;
    } | null;
  } | null;
}

/** Alunos matriculados (active=true) numa turma. */
export function useClassEnrollments(classId: string | undefined) {
  return useQuery({
    queryKey: ["chamada-enrollments", classId],
    queryFn: async (): Promise<EnrollmentWithStudent[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          "id, student_id, class_id, active, " +
            "student:students!inner(id, user_id, status, " +
            "profile:profiles!students_user_id_profiles_fkey(full_name, nickname, photo_url))",
        )
        .eq("class_id", classId)
        .eq("active", true);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<
        Omit<EnrollmentWithStudent, "student"> & {
          student: EnrollmentWithStudent["student"] | EnrollmentWithStudent["student"][] | null;
        }
      >;
      return rows.map((r) => {
        const stu = Array.isArray(r.student) ? r.student[0] ?? null : r.student;
        let normalized: EnrollmentWithStudent["student"] = null;
        if (stu) {
          const rawProfile = (stu as unknown as { profile: unknown }).profile;
          const prof = Array.isArray(rawProfile)
            ? ((rawProfile[0] ?? null) as NonNullable<EnrollmentWithStudent["student"]>["profile"])
            : ((rawProfile ?? null) as NonNullable<EnrollmentWithStudent["student"]>["profile"]);
          normalized = {
            id: stu.id,
            user_id: stu.user_id,
            status: stu.status,
            profile: prof,
          };
        }
        return { ...r, student: normalized };
      });
    },
    enabled: !!classId,
  });
}

export interface CheckinRow {
  id: string;
  student_id: string | null;
  class_id: string;
  ts: string;
  method: string;
  guest_name: string | null;
}

/** Check-ins do dia (start ... end) para uma turma. */
export function useClassCheckinsToday(classId: string | undefined, date?: Date) {
  const target = date ?? new Date();
  const dayStart = new Date(target);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(target);
  dayEnd.setHours(23, 59, 59, 999);
  const dayKey = dayStart.toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["chamada-checkins", classId, dayKey],
    queryFn: async (): Promise<CheckinRow[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("checkins")
        .select("id, student_id, class_id, ts, method, guest_name")
        .eq("class_id", classId)
        .gte("ts", dayStart.toISOString())
        .lte("ts", dayEnd.toISOString());
      if (error) throw error;
      return (data ?? []) as CheckinRow[];
    },
    enabled: !!classId,
  });
}

/** Cria check-in manual de aluno matriculado. */
export function useCreateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const { data, error } = await supabase
        .from("checkins")
        .insert({
          student_id: studentId,
          class_id: classId,
          method: "manual",
          geo_ok: false,
          ts: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chamada-checkins", vars.classId] });
    },
  });
}

/** Cria check-in avulso (sem student_id, com guest_name). */
export function useCreateGuestCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guestName, classId }: { guestName: string; classId: string }) => {
      const { data, error } = await supabase
        .from("checkins")
        .insert({
          student_id: null,
          class_id: classId,
          guest_name: guestName.trim(),
          method: "manual",
          geo_ok: false,
          ts: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chamada-checkins", vars.classId] });
    },
  });
}

/** Deleta um check-in (toggle presente → ausente). */
export function useDeleteCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checkinId, classId: _classId }: { checkinId: string; classId: string }) => {
      const { error } = await supabase.from("checkins").delete().eq("id", checkinId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chamada-checkins", vars.classId] });
    },
  });
}

/** Busca info básica da turma (start_time/venue/etc) para destacar atrasos. */
export function useClassInfo(classId: string | undefined) {
  return useQuery({
    queryKey: ["class-info", classId],
    queryFn: async () => {
      if (!classId) return null;
      const { data, error } = await supabase
        .from("classes")
        .select("id, weekday, start_time, end_time, venue:venues(id, name)")
        .eq("id", classId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}
