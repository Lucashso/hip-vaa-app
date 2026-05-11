// useClasses — CRUD de classes (turmas) + class_cancellations.
// O schema da tabela classes não tem name/level/boat_id como colunas;
// guardamos esses metadados no campo rules_json.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export type ClassLevel = "iniciante" | "intermediario" | "avancado";

export const CLASS_LEVELS: Array<{ value: ClassLevel; label: string }> = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

export const WEEKDAYS_LABELS = [
  { value: 0, label: "DOM", full: "Domingo" },
  { value: 1, label: "SEG", full: "Segunda" },
  { value: 2, label: "TER", full: "Terça" },
  { value: 3, label: "QUA", full: "Quarta" },
  { value: 4, label: "QUI", full: "Quinta" },
  { value: 5, label: "SEX", full: "Sexta" },
  { value: 6, label: "SÁB", full: "Sábado" },
];

export interface ClassRules {
  /** Metadados estendidos guardados em rules_json. */
  name?: string;
  level?: ClassLevel;
  boat_id?: string | null;
  level_required?: ClassLevel | null;
  // Rules clássicas (defaults do banco)
  checkin_window_min?: number;
  checkin_window_after_min?: number;
  cancel_hours_before?: number;
  [k: string]: unknown;
}

export interface ClassRow {
  id: string;
  tenant_id: string;
  venue_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  coach_user_id: string | null;
  rules_json: ClassRules | null;
  active: boolean;
  max_capacity: number | null;
  created_at: string;
  venue: { id: string; name: string } | null;
  boat: { id: string; name: string; type: string; capacity: number } | null;
  instructor: { id: string; full_name: string; nickname: string | null } | null;
  // Convenience getters from rules_json
  name: string;
  level: ClassLevel | null;
  boat_id: string | null;
  level_required: ClassLevel | null;
}

export interface ClassInput {
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  venue_id: string;
  boat_id: string | null;
  max_capacity: number | null;
  level: ClassLevel;
  level_required: ClassLevel | null;
  instructor_id: string | null;
  active: boolean;
}

export interface ClassFilters {
  weekday?: number | null;
  level?: ClassLevel | null;
  active?: boolean | null;
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function normalizeClass(
  row: {
    id: string;
    tenant_id: string;
    venue_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    coach_user_id: string | null;
    rules_json: ClassRules | null;
    active: boolean;
    max_capacity: number | null;
    created_at: string;
    venue?: unknown;
  },
  boatsById: Map<string, { id: string; name: string; type: string; capacity: number }>,
  profilesById: Map<string, { id: string; full_name: string; nickname: string | null }>,
): ClassRow {
  const rules = (row.rules_json ?? {}) as ClassRules;
  const boatId = (rules.boat_id ?? null) as string | null;
  const boat = boatId ? boatsById.get(boatId) ?? null : null;
  const instructor = row.coach_user_id ? profilesById.get(row.coach_user_id) ?? null : null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    venue_id: row.venue_id,
    weekday: row.weekday,
    start_time: row.start_time,
    end_time: row.end_time,
    coach_user_id: row.coach_user_id,
    rules_json: rules,
    active: row.active,
    max_capacity: row.max_capacity,
    created_at: row.created_at,
    venue: unwrap(row.venue) as ClassRow["venue"],
    boat,
    instructor,
    name: rules.name?.trim() || `Turma ${row.start_time.slice(0, 5)}`,
    level: (rules.level as ClassLevel) ?? null,
    boat_id: boatId,
    level_required: (rules.level_required as ClassLevel) ?? null,
  };
}

/** Lista classes do tenant (admin). */
export function useClasses(tenantId: string | undefined | null, filters?: ClassFilters) {
  return useQuery({
    queryKey: ["classes", tenantId, filters?.weekday ?? null, filters?.level ?? null, filters?.active ?? null],
    queryFn: async (): Promise<ClassRow[]> => {
      if (!tenantId) return [];
      let query = supabase
        .from("classes")
        .select(
          "id, tenant_id, venue_id, weekday, start_time, end_time, coach_user_id, rules_json, active, max_capacity, created_at, venue:venues(id, name)",
        )
        .eq("tenant_id", tenantId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });
      if (typeof filters?.weekday === "number") query = query.eq("weekday", filters.weekday);
      if (typeof filters?.active === "boolean") query = query.eq("active", filters.active);
      const { data, error } = await query;
      if (error) throw error;

      type RawRow = {
        id: string;
        tenant_id: string;
        venue_id: string;
        weekday: number;
        start_time: string;
        end_time: string;
        coach_user_id: string | null;
        rules_json: ClassRules | null;
        active: boolean;
        max_capacity: number | null;
        created_at: string;
        venue: unknown;
      };
      const rows = (data ?? []) as unknown as RawRow[];

      const boatIds = new Set<string>();
      const coachIds = new Set<string>();
      rows.forEach((r) => {
        const bid = (r.rules_json as ClassRules | null)?.boat_id;
        if (bid) boatIds.add(bid);
        if (r.coach_user_id) coachIds.add(r.coach_user_id);
      });

      const [boatsRes, profilesRes] = await Promise.all([
        boatIds.size > 0
          ? supabase
              .from("boats")
              .select("id, name, type, capacity")
              .in("id", Array.from(boatIds))
          : Promise.resolve({ data: [] as Array<{ id: string; name: string; type: string; capacity: number }>, error: null }),
        coachIds.size > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, nickname")
              .in("id", Array.from(coachIds))
          : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; nickname: string | null }>, error: null }),
      ]);

      const boatsById = new Map((boatsRes.data ?? []).map((b) => [b.id, b]));
      const profilesById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

      let normalized = rows.map((r) => normalizeClass(r, boatsById, profilesById));
      if (filters?.level) normalized = normalized.filter((c) => c.level === filters.level);
      return normalized;
    },
    enabled: !!tenantId,
  });
}

/** Detalhe de uma class. */
export function useClass(classId: string | undefined | null) {
  return useQuery({
    queryKey: ["class", classId],
    queryFn: async (): Promise<ClassRow | null> => {
      if (!classId) return null;
      const { data, error } = await supabase
        .from("classes")
        .select(
          "id, tenant_id, venue_id, weekday, start_time, end_time, coach_user_id, rules_json, active, max_capacity, created_at, venue:venues(id, name)",
        )
        .eq("id", classId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const rules = (data.rules_json ?? {}) as ClassRules;

      const [boatRes, profileRes] = await Promise.all([
        rules.boat_id
          ? supabase.from("boats").select("id, name, type, capacity").eq("id", rules.boat_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        data.coach_user_id
          ? supabase
              .from("profiles")
              .select("id, full_name, nickname")
              .eq("id", data.coach_user_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const boatsById = new Map<string, { id: string; name: string; type: string; capacity: number }>();
      if (boatRes.data) boatsById.set(boatRes.data.id, boatRes.data);
      const profilesById = new Map<string, { id: string; full_name: string; nickname: string | null }>();
      if (profileRes.data) profilesById.set(profileRes.data.id, profileRes.data);

      return normalizeClass(
        data as Parameters<typeof normalizeClass>[0],
        boatsById,
        profilesById,
      );
    },
    enabled: !!classId,
  });
}

function buildRulesJson(input: ClassInput, current?: ClassRules | null): ClassRules {
  const base: ClassRules = {
    checkin_window_min: 15,
    checkin_window_after_min: 10,
    cancel_hours_before: 2,
    ...(current ?? {}),
  };
  base.name = input.name;
  base.level = input.level;
  base.boat_id = input.boat_id;
  base.level_required = input.level_required;
  return base;
}

export function useCreateClass(tenantId: string | undefined | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("classes")
        .insert({
          tenant_id: tenantId,
          venue_id: input.venue_id,
          weekday: input.weekday,
          start_time: input.start_time,
          end_time: input.end_time,
          coach_user_id: input.instructor_id,
          max_capacity: input.max_capacity,
          rules_json: buildRulesJson(input),
          active: input.active,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["crew-classes-by-date"] });
      toast.success("Turma criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar turma: " + err.message),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, currentRules }: { id: string; input: ClassInput; currentRules?: ClassRules | null }) => {
      const { error } = await supabase
        .from("classes")
        .update({
          venue_id: input.venue_id,
          weekday: input.weekday,
          start_time: input.start_time,
          end_time: input.end_time,
          coach_user_id: input.instructor_id,
          max_capacity: input.max_capacity,
          rules_json: buildRulesJson(input, currentRules),
          active: input.active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["class", vars.id] });
      qc.invalidateQueries({ queryKey: ["crew-classes-by-date"] });
      toast.success("Turma atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar turma: " + err.message),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["crew-classes-by-date"] });
      toast.success("Turma excluída");
    },
    onError: (err: Error) => toast.error("Erro ao excluir turma: " + err.message),
  });
}

export function useToggleClassActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("classes").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["class", vars.id] });
      qc.invalidateQueries({ queryKey: ["crew-classes-by-date"] });
    },
    onError: (err: Error) => toast.error("Erro ao alterar status: " + err.message),
  });
}

// ============================================================
// Class cancellations
// ============================================================

export interface ClassCancellation {
  id: string;
  tenant_id: string;
  class_id: string | null;
  cancelled_date: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export function useClassCancellations(
  classId: string | undefined | null,
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery({
    queryKey: ["class-cancellations", classId, dateFrom ?? null, dateTo ?? null],
    queryFn: async (): Promise<ClassCancellation[]> => {
      if (!classId) return [];
      let q = supabase
        .from("class_cancellations")
        .select("id, tenant_id, class_id, cancelled_date, reason, created_by, created_at")
        .eq("class_id", classId)
        .order("cancelled_date", { ascending: false });
      if (dateFrom) q = q.gte("cancelled_date", dateFrom);
      if (dateTo) q = q.lte("cancelled_date", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ClassCancellation[];
    },
    enabled: !!classId,
  });
}

export function useCreateCancellation(tenantId: string | undefined | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      class_id,
      date,
      reason,
    }: {
      class_id: string;
      date: string;
      reason?: string | null;
    }) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("class_cancellations")
        .insert({
          tenant_id: tenantId,
          class_id,
          cancelled_date: date,
          reason: reason ?? null,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-cancellations"] });
      qc.invalidateQueries({ queryKey: ["coach-calendar"] });
      toast.success("Aula cancelada");
    },
    onError: (err: Error) => toast.error("Erro ao cancelar: " + err.message),
  });
}

export function useDeleteCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_cancellations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-cancellations"] });
      qc.invalidateQueries({ queryKey: ["coach-calendar"] });
      toast.success("Cancelamento removido");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

// ============================================================
// Coach calendar — próximos N dias
// ============================================================

export interface CoachDayEntry {
  date: string;
  classes: Array<{
    id: string;
    start_time: string;
    end_time: string;
    name: string;
    venue: { id: string; name: string } | null;
    weekday: number;
    cancelled: boolean;
    cancellation_reason: string | null;
  }>;
  crew_count: number;
  sessions: Array<{
    id: string;
    session_date: string;
    title: string;
    status: string | null;
    student_id: string;
    student_name: string | null;
  }>;
}

export function useCoachCalendar(
  coachUserId: string | undefined | null,
  dateFrom: Date,
  days = 7,
) {
  const fromKey = formatDateKey(dateFrom);
  return useQuery({
    queryKey: ["coach-calendar", coachUserId, fromKey, days],
    queryFn: async (): Promise<CoachDayEntry[]> => {
      if (!coachUserId) return [];

      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const endKey = formatDateKey(end);

      // 1. Classes do coach (recurring)
      const { data: classesRaw, error: classErr } = await supabase
        .from("classes")
        .select(
          "id, weekday, start_time, end_time, rules_json, venue:venues(id, name)",
        )
        .eq("coach_user_id", coachUserId)
        .eq("active", true);
      if (classErr) throw classErr;
      type ClassMini = {
        id: string;
        weekday: number;
        start_time: string;
        end_time: string;
        rules_json: ClassRules | null;
        venue: unknown;
      };
      const coachClasses = ((classesRaw ?? []) as unknown as ClassMini[]).map((c) => ({
        ...c,
        venue: unwrap(c.venue) as { id: string; name: string } | null,
        name: ((c.rules_json as ClassRules | null)?.name ?? "").toString().trim() || `Turma ${c.start_time.slice(0, 5)}`,
      }));

      const classIds = coachClasses.map((c) => c.id);

      // 2. Cancellations no range
      const cancellationsRes = classIds.length > 0
        ? await supabase
            .from("class_cancellations")
            .select("class_id, cancelled_date, reason")
            .in("class_id", classIds)
            .gte("cancelled_date", fromKey)
            .lte("cancelled_date", endKey)
        : { data: [] as Array<{ class_id: string; cancelled_date: string; reason: string | null }>, error: null };
      if (cancellationsRes.error) throw cancellationsRes.error;
      const cancellations = (cancellationsRes.data ?? []) as Array<{
        class_id: string;
        cancelled_date: string;
        reason: string | null;
      }>;

      // 3. Crew assignments do coach no range
      const crewRes = await supabase
        .from("crew_assignments")
        .select("id, class_id, class_date")
        .eq("staff_user_id", coachUserId)
        .gte("class_date", fromKey)
        .lte("class_date", endKey);
      if (crewRes.error) throw crewRes.error;
      const crewByDate = new Map<string, number>();
      ((crewRes.data ?? []) as Array<{ class_date: string }>).forEach((c) => {
        crewByDate.set(c.class_date, (crewByDate.get(c.class_date) ?? 0) + 1);
      });

      // 4. Training sessions onde coach_id = coachUserId
      const sessionsRes = await supabase
        .from("training_sessions")
        .select("id, session_date, title, status, student_id")
        .eq("coach_id", coachUserId)
        .gte("session_date", fromKey)
        .lte("session_date", endKey)
        .order("session_date", { ascending: true });
      if (sessionsRes.error) throw sessionsRes.error;
      type SessionRow = {
        id: string;
        session_date: string;
        title: string;
        status: string | null;
        student_id: string;
      };
      const sessions = (sessionsRes.data ?? []) as SessionRow[];

      // Busca nomes dos alunos das sessions
      const studentIds = Array.from(new Set(sessions.map((s) => s.student_id)));
      let studentNameById = new Map<string, string | null>();
      if (studentIds.length > 0) {
        const studRes = await supabase
          .from("students")
          .select("id, user_id")
          .in("id", studentIds);
        if (studRes.error) throw studRes.error;
        const studs = (studRes.data ?? []) as Array<{ id: string; user_id: string }>;
        const userIds = Array.from(new Set(studs.map((s) => s.user_id)));
        const profRes = userIds.length > 0
          ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
          : { data: [] as Array<{ id: string; full_name: string }>, error: null };
        if (profRes.error) throw profRes.error;
        const profMap = new Map(
          (profRes.data ?? []).map((p) => [p.id, p.full_name] as const),
        );
        studentNameById = new Map(
          studs.map((s) => [s.id, profMap.get(s.user_id) ?? null] as const),
        );
      }

      // Monta dias
      const result: CoachDayEntry[] = [];
      for (let i = 0; i < days; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dKey = formatDateKey(d);
        const wd = d.getDay();
        const classesForDay = coachClasses
          .filter((c) => c.weekday === wd)
          .map((c) => {
            const cancel = cancellations.find(
              (cc) => cc.class_id === c.id && cc.cancelled_date === dKey,
            );
            return {
              id: c.id,
              start_time: c.start_time,
              end_time: c.end_time,
              name: c.name,
              venue: c.venue,
              weekday: c.weekday,
              cancelled: !!cancel,
              cancellation_reason: cancel?.reason ?? null,
            };
          })
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        const sessionsForDay = sessions
          .filter((s) => s.session_date === dKey)
          .map((s) => ({
            id: s.id,
            session_date: s.session_date,
            title: s.title,
            status: s.status,
            student_id: s.student_id,
            student_name: studentNameById.get(s.student_id) ?? null,
          }));

        result.push({
          date: dKey,
          classes: classesForDay,
          crew_count: crewByDate.get(dKey) ?? 0,
          sessions: sessionsForDay,
        });
      }

      return result;
    },
    enabled: !!coachUserId,
  });
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface QuickSessionInput {
  student_id: string;
  workout_template_id: string | null;
  title: string;
  scheduled_date: string;
}

/** Criação rápida de training_session (do Coach.tsx). */
export function useQuickCreateSession(tenantId: string | undefined | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuickSessionInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let title = input.title.trim();
      let description: string | null = null;

      if (input.workout_template_id) {
        const { data: tpl } = await supabase
          .from("workout_templates")
          .select("name, description")
          .eq("id", input.workout_template_id)
          .maybeSingle();
        if (tpl) {
          if (!title) title = tpl.name;
          description = tpl.description ?? null;
        }
      }
      if (!title) title = "Sessão de treino";

      const { data, error } = await supabase
        .from("training_sessions")
        .insert({
          tenant_id: tenantId,
          student_id: input.student_id,
          coach_id: user?.id ?? null,
          session_date: input.scheduled_date,
          title,
          description,
          status: "planned",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-calendar"] });
      qc.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success("Sessão criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar sessão: " + err.message),
  });
}
