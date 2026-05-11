// useCrew — hooks read-only para visão de Coach (CoachCrew).
// Lista classes do dia + assignments de barco/aluno por turma.
// Inclui CRUD de crew_templates + assentos (admin).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ClassByDate {
  id: string;
  tenant_id: string;
  venue_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  coach_user_id: string | null;
  venue: { id: string; name: string } | null;
}

/** Classes ativas do tenant com weekday=date.getDay(). */
export function useClassesByDate(tenantId: string | undefined | null, date: Date) {
  const weekday = date.getDay();
  return useQuery({
    queryKey: ["crew-classes-by-date", tenantId, weekday],
    queryFn: async (): Promise<ClassByDate[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, tenant_id, venue_id, weekday, start_time, end_time, active, coach_user_id, venue:venues(id, name)")
        .eq("tenant_id", tenantId)
        .eq("weekday", weekday)
        .eq("active", true)
        .order("start_time", { ascending: true });
      if (error) throw error;
      type Row = Omit<ClassByDate, "venue"> & { venue: ClassByDate["venue"] | ClassByDate["venue"][] | null };
      return ((data ?? []) as unknown as Row[]).map((c) => ({
        ...c,
        venue: Array.isArray(c.venue) ? c.venue[0] ?? null : c.venue,
      }));
    },
    enabled: !!tenantId,
  });
}

export interface CrewAssignmentForCoach {
  id: string;
  class_id: string;
  class_date: string;
  boat_id: string;
  student_id: string | null;
  staff_user_id: string | null;
  seat_position: number;
  guest_name: string | null;
  student: {
    id: string;
    user_id: string;
    profile: {
      full_name: string;
      nickname: string | null;
      photo_url: string | null;
    } | null;
  } | null;
  staff: {
    id: string;
    full_name: string;
    nickname: string | null;
    photo_url: string | null;
  } | null;
  boat: {
    id: string;
    name: string;
    type: string;
    capacity: number;
  } | null;
}

/** Crew assignments para uma turma + data. */
export function useCrewAssignmentsForClass(classId: string | undefined, date: Date) {
  const dateKey = formatDateKey(date);
  return useQuery({
    queryKey: ["crew-assignments-for-class", classId, dateKey],
    queryFn: async (): Promise<CrewAssignmentForCoach[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("crew_assignments")
        .select(
          "id, class_id, class_date, boat_id, student_id, staff_user_id, seat_position, guest_name, " +
            "student:students(id, user_id, profile:profiles!students_user_id_profiles_fkey(full_name, nickname, photo_url)), " +
            "staff:profiles!crew_assignments_staff_user_id_fkey(id, full_name, nickname, photo_url), " +
            "boat:boats!crew_assignments_boat_id_fkey(id, name, type, capacity)",
        )
        .eq("class_id", classId)
        .eq("class_date", dateKey)
        .order("seat_position", { ascending: true });
      if (error) throw error;
      type Row = Omit<CrewAssignmentForCoach, "student" | "staff" | "boat"> & {
        student: CrewAssignmentForCoach["student"] | CrewAssignmentForCoach["student"][] | null;
        staff: CrewAssignmentForCoach["staff"] | CrewAssignmentForCoach["staff"][] | null;
        boat: CrewAssignmentForCoach["boat"] | CrewAssignmentForCoach["boat"][] | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => {
        const studentRaw = Array.isArray(r.student) ? r.student[0] ?? null : r.student;
        let student: CrewAssignmentForCoach["student"] = null;
        if (studentRaw) {
          const rawProfile = (studentRaw as unknown as { profile: unknown }).profile;
          const prof = Array.isArray(rawProfile)
            ? ((rawProfile[0] ?? null) as NonNullable<CrewAssignmentForCoach["student"]>["profile"])
            : ((rawProfile ?? null) as NonNullable<CrewAssignmentForCoach["student"]>["profile"]);
          student = { id: studentRaw.id, user_id: studentRaw.user_id, profile: prof };
        }
        const staff = Array.isArray(r.staff) ? r.staff[0] ?? null : r.staff;
        const boat = Array.isArray(r.boat) ? r.boat[0] ?? null : r.boat;
        return { ...r, student, staff, boat };
      });
    },
    enabled: !!classId,
  });
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Helper exportado para formatação consistente. */
export function toDateKey(d: Date): string {
  return formatDateKey(d);
}

// ============================================================
// Admin · CRUD de templates de tripulação
// ============================================================

export interface CrewTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  boat_id: string;
  created_at: string;
  boat?: { id: string; name: string; capacity: number; type: string } | null;
}

export interface CrewTemplateSeat {
  id: string;
  template_id: string;
  seat_position: number;
  student_id: string | null;
  staff_user_id: string | null;
}

export interface CrewTemplateInput {
  name: string;
  description: string | null;
  boat_id: string;
}

export interface CrewSeatInput {
  seat_position: number;
  student_id: string | null;
}

export function useCrewTemplates(tenantId?: string | null) {
  return useQuery({
    queryKey: ["crew-templates", tenantId],
    queryFn: async (): Promise<CrewTemplate[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("crew_templates")
        .select(
          "id, tenant_id, name, description, boat_id, created_at, boat:boats(id, name, capacity, type)",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      type Row = Omit<CrewTemplate, "boat"> & { boat: CrewTemplate["boat"] | CrewTemplate["boat"][] | null };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        ...r,
        boat: Array.isArray(r.boat) ? r.boat[0] ?? null : r.boat,
      }));
    },
    enabled: !!tenantId,
  });
}

export function useCrewTemplateSeats(templateId?: string | null) {
  return useQuery({
    queryKey: ["crew-template-seats", templateId],
    queryFn: async (): Promise<CrewTemplateSeat[]> => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from("crew_template_seats")
        .select("id, template_id, seat_position, student_id, staff_user_id")
        .eq("template_id", templateId)
        .order("seat_position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CrewTemplateSeat[];
    },
    enabled: !!templateId,
  });
}

export function useCreateCrewTemplate(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CrewTemplateInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("crew_templates")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          description: input.description,
          boat_id: input.boat_id,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crew-templates"] });
      qc.invalidateQueries({ queryKey: ["admin", "equipes"] });
      toast.success("Equipe criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar equipe: " + err.message),
  });
}

export function useUpdateCrewTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CrewTemplateInput }) => {
      const { error } = await supabase
        .from("crew_templates")
        .update({
          name: input.name,
          description: input.description,
          boat_id: input.boat_id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crew-templates"] });
      qc.invalidateQueries({ queryKey: ["admin", "equipes"] });
      toast.success("Equipe atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar: " + err.message),
  });
}

export function useDeleteCrewTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const seats = await supabase.from("crew_template_seats").delete().eq("template_id", id);
      if (seats.error) throw seats.error;
      const { error } = await supabase.from("crew_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crew-templates"] });
      qc.invalidateQueries({ queryKey: ["admin", "equipes"] });
      toast.success("Equipe excluída");
    },
    onError: (err: Error) => toast.error("Erro ao excluir: " + err.message),
  });
}

/** Bulk replace dos assentos do template. */
export function useSaveCrewSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, seats }: { templateId: string; seats: CrewSeatInput[] }) => {
      const del = await supabase
        .from("crew_template_seats")
        .delete()
        .eq("template_id", templateId);
      if (del.error) throw del.error;
      const valid = seats.filter((s) => s.student_id);
      if (valid.length === 0) return;
      const { error } = await supabase.from("crew_template_seats").insert(
        valid.map((s) => ({
          template_id: templateId,
          seat_position: s.seat_position,
          student_id: s.student_id,
        })),
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["crew-template-seats", vars.templateId] });
      qc.invalidateQueries({ queryKey: ["crew-templates"] });
      qc.invalidateQueries({ queryKey: ["admin", "equipes"] });
      toast.success("Assentos salvos!");
    },
    onError: (err: Error) => toast.error("Erro ao salvar assentos: " + err.message),
  });
}

export interface StudentForSelect {
  id: string;
  user_id: string;
  full_name: string;
  nickname: string | null;
}

export function useTenantStudents(tenantId?: string | null) {
  return useQuery({
    queryKey: ["tenant-students-select", tenantId],
    queryFn: async (): Promise<StudentForSelect[]> => {
      if (!tenantId) return [];
      const studentsRes = await supabase
        .from("students")
        .select("id, user_id")
        .eq("tenant_id", tenantId)
        .eq("status", "active");
      if (studentsRes.error) throw studentsRes.error;
      type StudentRow = { id: string; user_id: string };
      const students = (studentsRes.data ?? []) as StudentRow[];
      const userIds = students.map((s) => s.user_id);
      let profiles: { id: string; full_name: string; nickname: string | null }[] = [];
      if (userIds.length) {
        const pr = await supabase
          .from("profiles")
          .select("id, full_name, nickname")
          .in("id", userIds);
        if (pr.error) throw pr.error;
        profiles = (pr.data ?? []) as typeof profiles;
      }
      const pmap = new Map(profiles.map((p) => [p.id, p]));
      return students
        .map((s) => ({
          id: s.id,
          user_id: s.user_id,
          full_name: pmap.get(s.user_id)?.full_name ?? "—",
          nickname: pmap.get(s.user_id)?.nickname ?? null,
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: !!tenantId,
  });
}
