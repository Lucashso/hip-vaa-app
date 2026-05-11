// Hooks para listagem de alunos da filial (visão admin/equipe) e detalhe.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AlunoListItem {
  id: string;
  user_id: string;
  tenant_id: string;
  status: "active" | "delinquent" | "inactive" | "pending";
  plan_id: string | null;
  is_scholarship: boolean;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
  } | null;
  plan: {
    id: string;
    name: string;
    price_cents: number;
    type: string;
  } | null;
  latest_invoice: {
    id: string;
    status: string;
    due_date: string;
    amount_cents: number;
    paid_at: string | null;
  } | null;
}

interface UseAlunosOptions {
  status?: "active" | "delinquent" | "inactive" | "pending" | "all";
  search?: string;
}

/** Lista de alunos da filial com joins de plano + última fatura. */
export function useAlunos(tenantId: string | undefined | null, opts: UseAlunosOptions = {}) {
  return useQuery({
    queryKey: ["alunos", tenantId, opts.status ?? "all", opts.search ?? ""],
    queryFn: async (): Promise<AlunoListItem[]> => {
      if (!tenantId) return [];

      let q = supabase
        .from("students")
        .select(
          "id, user_id, tenant_id, status, plan_id, is_scholarship, created_at, " +
            "profile:profiles!students_user_id_profiles_fkey(id, full_name, nickname, email, phone, photo_url), " +
            "plan:plans(id, name, price_cents, type)",
        )
        .eq("tenant_id", tenantId);

      if (opts.status && opts.status !== "all") {
        q = q.eq("status", opts.status);
      }

      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<Omit<AlunoListItem, "latest_invoice"> & { profile: AlunoListItem["profile"] | AlunoListItem["profile"][]; plan: AlunoListItem["plan"] | AlunoListItem["plan"][] }>;

      // Normaliza joins (Supabase pode retornar como array em alguns casos)
      let alunos: AlunoListItem[] = rows.map((r) => {
        const profile = Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile;
        const plan = Array.isArray(r.plan) ? r.plan[0] ?? null : r.plan;
        return { ...r, profile, plan, latest_invoice: null };
      });

      // Filtro client-side por nome/email
      if (opts.search) {
        const term = opts.search.toLowerCase();
        alunos = alunos.filter((a) => {
          const name = a.profile?.full_name?.toLowerCase() ?? "";
          const email = a.profile?.email?.toLowerCase() ?? "";
          return name.includes(term) || email.includes(term);
        });
      }

      // Última fatura por aluno (uma query agregada)
      const ids = alunos.map((a) => a.id);
      if (ids.length === 0) return alunos;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, student_id, status, due_date, amount_cents, paid_at")
        .in("student_id", ids)
        .order("due_date", { ascending: false });

      const latestByStudent = new Map<string, AlunoListItem["latest_invoice"]>();
      (invoices ?? []).forEach((inv) => {
        if (!latestByStudent.has(inv.student_id)) {
          latestByStudent.set(inv.student_id, {
            id: inv.id,
            status: inv.status,
            due_date: inv.due_date,
            amount_cents: inv.amount_cents,
            paid_at: inv.paid_at,
          });
        }
      });

      return alunos.map((a) => ({ ...a, latest_invoice: latestByStudent.get(a.id) ?? null }));
    },
    enabled: !!tenantId,
  });
}

export interface AlunoDetalhe {
  student: {
    id: string;
    user_id: string;
    tenant_id: string;
    status: "active" | "delinquent" | "inactive" | "pending";
    plan_id: string | null;
    is_scholarship: boolean;
    created_at: string;
    invoice_due_day: number | null;
    medical_notes: string | null;
  };
  profile: {
    id: string;
    full_name: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    birthdate: string | null;
  } | null;
  plan: {
    id: string;
    name: string;
    price_cents: number;
    type: string;
  } | null;
  enrollments: Array<{
    id: string;
    class_id: string;
    active: boolean;
    class: {
      id: string;
      weekday: number;
      start_time: string;
      end_time: string;
      venue: { id: string; name: string } | null;
    } | null;
  }>;
  checkins: Array<{
    id: string;
    ts: string;
    method: string;
    class_id: string;
  }>;
  invoices: Array<{
    id: string;
    status: string;
    due_date: string;
    amount_cents: number;
    paid_at: string | null;
  }>;
}

/** Detalhe completo de um aluno (admin view). */
export function useAlunoDetalhe(studentId: string | undefined) {
  return useQuery({
    queryKey: ["aluno-detalhe", studentId],
    queryFn: async (): Promise<AlunoDetalhe | null> => {
      if (!studentId) return null;

      const { data: student, error: sErr } = await supabase
        .from("students")
        .select("id, user_id, tenant_id, status, plan_id, is_scholarship, created_at, invoice_due_day, medical_notes")
        .eq("id", studentId)
        .single();
      if (sErr) throw sErr;
      if (!student) return null;

      const [{ data: profile }, { data: plan }, { data: enrollments }, { data: checkins }, { data: invoices }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, nickname, email, phone, photo_url, birthdate")
          .eq("id", student.user_id)
          .maybeSingle(),
        student.plan_id
          ? supabase
              .from("plans")
              .select("id, name, price_cents, type")
              .eq("id", student.plan_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("enrollments")
          .select("id, class_id, active, classes(id, weekday, start_time, end_time, venues(id, name))")
          .eq("student_id", studentId),
        supabase
          .from("checkins")
          .select("id, ts, method, class_id")
          .eq("student_id", studentId)
          .order("ts", { ascending: false })
          .limit(10),
        supabase
          .from("invoices")
          .select("id, status, due_date, amount_cents, paid_at")
          .eq("student_id", studentId)
          .order("due_date", { ascending: false })
          .limit(12),
      ]);

      const normalizedEnrollments = ((enrollments ?? []) as Array<{
        id: string;
        class_id: string;
        active: boolean;
        classes: unknown;
      }>).map((e) => {
        const arr = Array.isArray(e.classes) ? e.classes : [e.classes];
        const c = arr[0] as
          | { id: string; weekday: number; start_time: string; end_time: string; venues?: unknown }
          | null;
        if (!c) return { id: e.id, class_id: e.class_id, active: e.active, class: null };
        const vArr = Array.isArray(c.venues) ? c.venues : [c.venues];
        const venue = (vArr[0] as { id: string; name: string } | null) ?? null;
        return {
          id: e.id,
          class_id: e.class_id,
          active: e.active,
          class: { id: c.id, weekday: c.weekday, start_time: c.start_time, end_time: c.end_time, venue },
        };
      });

      return {
        student: student as AlunoDetalhe["student"],
        profile: (profile as AlunoDetalhe["profile"]) ?? null,
        plan: (plan as AlunoDetalhe["plan"]) ?? null,
        enrollments: normalizedEnrollments,
        checkins: (checkins ?? []) as AlunoDetalhe["checkins"],
        invoices: (invoices ?? []) as AlunoDetalhe["invoices"],
      };
    },
    enabled: !!studentId,
  });
}

export interface FinanceiroFilialSummary {
  receita_confirmada_cents: number;
  a_receber_cents: number;
  a_receber_count: number;
  inadimplencia_cents: number;
  inadimplencia_count: number;
  pagas_pct: number;
  abertas_pct: number;
  vencidas_pct: number;
  inadimplentes: Array<{
    student_id: string;
    full_name: string | null;
    amount_cents: number;
    due_date: string;
    days_late: number;
  }>;
}

/** Resumo financeiro da filial (mês corrente). */
export function useFinanceiroFilial(tenantId: string | undefined | null) {
  return useQuery({
    queryKey: ["financeiro-filial", tenantId],
    queryFn: async (): Promise<FinanceiroFilialSummary> => {
      if (!tenantId) {
        return {
          receita_confirmada_cents: 0,
          a_receber_cents: 0,
          a_receber_count: 0,
          inadimplencia_cents: 0,
          inadimplencia_count: 0,
          pagas_pct: 0,
          abertas_pct: 0,
          vencidas_pct: 0,
          inadimplentes: [],
        };
      }

      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const today = now.toISOString().split("T")[0];

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, student_id, status, due_date, amount_cents, paid_at")
        .eq("tenant_id", tenantId)
        .gte("due_date", startMonth.toISOString().split("T")[0])
        .lte("due_date", endMonth.toISOString().split("T")[0]);
      if (error) throw error;

      const list = invoices ?? [];

      let receita = 0;
      let receber = 0;
      let receberCount = 0;
      let inadCents = 0;
      const inadStudents = new Set<string>();
      const overdueByStudent = new Map<string, { amount_cents: number; due_date: string }>();

      let pagasCents = 0;
      let abertasCents = 0;
      let vencidasCents = 0;

      list.forEach((inv) => {
        if (inv.status === "paid") {
          receita += inv.amount_cents;
          pagasCents += inv.amount_cents;
        } else if (inv.status === "pending") {
          // Atrasada se due_date < hoje
          if (inv.due_date < today) {
            inadCents += inv.amount_cents;
            inadStudents.add(inv.student_id);
            vencidasCents += inv.amount_cents;
            const existing = overdueByStudent.get(inv.student_id);
            if (!existing || inv.due_date < existing.due_date) {
              overdueByStudent.set(inv.student_id, { amount_cents: inv.amount_cents, due_date: inv.due_date });
            }
          } else {
            receber += inv.amount_cents;
            receberCount += 1;
            abertasCents += inv.amount_cents;
          }
        }
      });

      const totalStatus = pagasCents + abertasCents + vencidasCents;
      const pagasPct = totalStatus > 0 ? Math.round((pagasCents / totalStatus) * 100) : 0;
      const abertasPct = totalStatus > 0 ? Math.round((abertasCents / totalStatus) * 100) : 0;
      const vencidasPct = totalStatus > 0 ? Math.max(0, 100 - pagasPct - abertasPct) : 0;

      // Busca nomes dos inadimplentes
      const overdueIds = Array.from(overdueByStudent.keys());
      let inadimplentes: FinanceiroFilialSummary["inadimplentes"] = [];
      if (overdueIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, user_id, profile:profiles!students_user_id_profiles_fkey(full_name)")
          .in("id", overdueIds);

        type StudentRow = { id: string; user_id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null };
        inadimplentes = ((students ?? []) as unknown as StudentRow[]).map((s) => {
          const profile = Array.isArray(s.profile) ? s.profile[0] ?? null : s.profile;
          const inv = overdueByStudent.get(s.id)!;
          const due = new Date(inv.due_date);
          const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            student_id: s.id,
            full_name: profile?.full_name ?? null,
            amount_cents: inv.amount_cents,
            due_date: inv.due_date,
            days_late: days,
          };
        });
        inadimplentes.sort((a, b) => b.days_late - a.days_late);
      }

      return {
        receita_confirmada_cents: receita,
        a_receber_cents: receber,
        a_receber_count: receberCount,
        inadimplencia_cents: inadCents,
        inadimplencia_count: inadStudents.size,
        pagas_pct: pagasPct,
        abertas_pct: abertasPct,
        vencidas_pct: vencidasPct,
        inadimplentes,
      };
    },
    enabled: !!tenantId,
  });
}

export interface CrewTemplate {
  id: string;
  tenant_id: string;
  name: string;
  boat_id: string;
  description: string | null;
  boat: { id: string; name: string; type: string } | null;
  seats: Array<{
    id: string;
    seat_position: number;
    student_id: string | null;
    staff_user_id: string | null;
    student: { id: string; full_name: string | null } | null;
    staff: { id: string; full_name: string | null } | null;
  }>;
}

/** Crew templates do tenant + seats com nome dos ocupantes. */
export function useCrewTemplates(tenantId: string | undefined | null) {
  return useQuery({
    queryKey: ["crew-templates", tenantId],
    queryFn: async (): Promise<CrewTemplate[]> => {
      if (!tenantId) return [];

      const { data: templates, error } = await supabase
        .from("crew_templates")
        .select("id, tenant_id, name, boat_id, description, boat:boats(id, name, type)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const tList = ((templates ?? []) as unknown as Array<Omit<CrewTemplate, "seats" | "boat"> & { boat: CrewTemplate["boat"] | CrewTemplate["boat"][] }>).map((t) => ({
        ...t,
        boat: Array.isArray(t.boat) ? t.boat[0] ?? null : t.boat,
      }));

      if (tList.length === 0) return [];

      const ids = tList.map((t) => t.id);
      const { data: seats } = await supabase
        .from("crew_template_seats")
        .select(
          "id, template_id, seat_position, student_id, staff_user_id, " +
            "student:students(id, profile:profiles!students_user_id_profiles_fkey(full_name)), " +
            "staff:profiles!crew_template_seats_staff_user_id_fkey(id, full_name)",
        )
        .in("template_id", ids)
        .order("seat_position", { ascending: true });

      type SeatRow = {
        id: string;
        template_id: string;
        seat_position: number;
        student_id: string | null;
        staff_user_id: string | null;
        student:
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]
          | null;
        staff: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null;
      };

      const seatRows = ((seats ?? []) as unknown as SeatRow[]).map((s) => {
        const student = Array.isArray(s.student) ? s.student[0] ?? null : s.student;
        let studentObj: CrewTemplate["seats"][0]["student"] = null;
        if (student) {
          const sp = Array.isArray(student.profile) ? student.profile[0] ?? null : student.profile;
          studentObj = { id: student.id, full_name: sp?.full_name ?? null };
        }
        const staff = Array.isArray(s.staff) ? s.staff[0] ?? null : s.staff;
        return {
          template_id: s.template_id,
          id: s.id,
          seat_position: s.seat_position,
          student_id: s.student_id,
          staff_user_id: s.staff_user_id,
          student: studentObj,
          staff: staff ?? null,
        };
      });

      return tList.map((t) => ({
        ...t,
        seats: seatRows.filter((s) => s.template_id === t.id).map(({ template_id: _t, ...rest }) => rest),
      }));
    },
    enabled: !!tenantId,
  });
}

/** Mutation para atualizar tenant (configuração da filial). */
export function useUpdateTenant(tenantId: string | undefined | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!tenantId) throw new Error("tenant_id ausente");
      const { data, error } = await supabase
        .from("tenants")
        .update(patch)
        .eq("id", tenantId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD alunos (mensalistas)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateStudentInput {
  tenant_id: string;
  email: string;
  password: string;
  full_name: string;
  nickname?: string | null;
  cpf: string;
  birthdate: string; // YYYY-MM-DD
  phone: string;
  address: string;
  postal_code?: string | null;
  address_number?: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type?: string;
  can_swim?: boolean;
  medical_notes?: string | null;
  consent_signed?: boolean;
  plan_id?: string | null;
  is_scholarship?: boolean;
  billing_start_date?: string | null;
}

/** Cria aluno (mensalista) via edge function admin-create-student. */
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const response = await supabase.functions.invoke("admin-create-student", {
        body: {
          email: input.email,
          password: input.password,
          full_name: input.full_name,
          nickname: input.nickname || undefined,
          cpf: input.cpf.replace(/\D/g, ""),
          birthdate: input.birthdate,
          phone: input.phone,
          address: input.address,
          postal_code: input.postal_code || undefined,
          address_number: input.address_number || undefined,
          emergency_contact_name: input.emergency_contact_name,
          emergency_contact_phone: input.emergency_contact_phone,
          blood_type: input.blood_type || "unknown",
          can_swim: input.can_swim ?? true,
          medical_notes: input.medical_notes || undefined,
          consent_signed: input.consent_signed ?? true,
          plan_id: input.plan_id || undefined,
          tenant_id: input.tenant_id,
          is_scholarship: input.is_scholarship ?? false,
          billing_start_date: input.billing_start_date || undefined,
        },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao criar aluno");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as { success: boolean; userId: string; studentId: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno criado!");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao criar aluno"),
  });
}

export interface UpdateStudentInput {
  status?: "active" | "delinquent" | "inactive" | "pending";
  plan_id?: string | null;
  is_scholarship?: boolean;
  medical_notes?: string | null;
  invoice_due_day?: number | null;
  billing_start_date?: string | null;
}

/** Update direto em students. */
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateStudentInput }) => {
      const { data, error } = await supabase
        .from("students")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      qc.invalidateQueries({ queryKey: ["aluno-detalhe", vars.id] });
      toast.success("Aluno atualizado");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao atualizar aluno"),
  });
}

/** Deleta aluno (cancela matrícula) via edge admin-delete-student. */
export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const response = await supabase.functions.invoke("admin-delete-student", {
        body: { student_id: studentId },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao excluir aluno");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as { success: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Matrícula cancelada");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao cancelar matrícula"),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrollments (matrículas em turmas)
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  active: boolean;
  created_at: string;
  class: {
    id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    venue: { id: string; name: string } | null;
  } | null;
}

/** Lista de enrollments de um aluno. */
export function useStudentEnrollments(studentId: string | undefined | null) {
  return useQuery({
    queryKey: ["student-enrollments", studentId],
    queryFn: async (): Promise<StudentEnrollment[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          "id, student_id, class_id, active, created_at, " +
            "class:classes(id, weekday, start_time, end_time, venue:venues(id, name))",
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      type Row = Omit<StudentEnrollment, "class"> & {
        class: StudentEnrollment["class"] | StudentEnrollment["class"][] | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => {
        const cls = Array.isArray(r.class) ? r.class[0] ?? null : r.class;
        if (!cls) return { ...r, class: null };
        const v = cls.venue;
        const venue = Array.isArray(v) ? v[0] ?? null : v;
        return {
          ...r,
          class: {
            id: cls.id,
            weekday: cls.weekday,
            start_time: cls.start_time,
            end_time: cls.end_time,
            venue: venue ? { id: venue.id, name: venue.name } : null,
          },
        };
      });
    },
    enabled: !!studentId,
  });
}

/** Matricula aluno numa turma. */
export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      // Se já existe enrollment inativo, reativa em vez de criar duplicado.
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id, active")
        .eq("student_id", studentId)
        .eq("class_id", classId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("enrollments")
          .update({ active: true })
          .eq("id", existing.id);
        if (error) throw error;
        return { id: existing.id, reactivated: true };
      }
      const { data, error } = await supabase
        .from("enrollments")
        .insert({ student_id: studentId, class_id: classId, active: true })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id, reactivated: false };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["student-enrollments", vars.studentId] });
      qc.invalidateQueries({ queryKey: ["aluno-detalhe", vars.studentId] });
      toast.success("Aluno matriculado na turma!");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao matricular"),
  });
}

/** Desativa um enrollment. */
export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("enrollments")
        .update({ active: false })
        .eq("id", enrollmentId);
      if (error) throw error;
      return { id: enrollmentId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-enrollments"] });
      qc.invalidateQueries({ queryKey: ["aluno-detalhe"] });
      toast.success("Matrícula removida");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao remover matrícula"),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Documentos & faturas do aluno
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentDocument {
  id: string;
  student_id: string;
  tenant_id: string;
  document_type: string;
  document_type_label: string | null;
  file_url: string;
  file_name: string;
  issue_date: string | null;
  expiration_date: string | null;
  reminder_days: number | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useStudentDocuments(studentId: string | undefined | null) {
  return useQuery({
    queryKey: ["student-documents", studentId],
    queryFn: async (): Promise<StudentDocument[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_documents")
        .select(
          "id, student_id, tenant_id, document_type, document_type_label, file_url, file_name, issue_date, expiration_date, reminder_days, notes, uploaded_by, created_at, updated_at",
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentDocument[];
    },
    enabled: !!studentId,
  });
}

export interface UploadStudentDocumentInput {
  studentId: string;
  tenantId: string;
  file: File;
  documentType: string;
  documentTypeLabel?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
}

/** Faz upload de documento do aluno (bucket tenant-assets) + insere em student_documents. */
export function useUploadStudentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadStudentDocumentInput) => {
      const ext = input.file.name.split(".").pop() ?? "bin";
      const path = `${input.tenantId}/students/${input.studentId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("tenant-assets")
        .upload(path, input.file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("tenant-assets").getPublicUrl(path);

      const { data: { session } } = await supabase.auth.getSession();
      const uploadedBy = session?.user?.id ?? null;

      const { data, error } = await supabase
        .from("student_documents")
        .insert({
          student_id: input.studentId,
          tenant_id: input.tenantId,
          document_type: input.documentType,
          document_type_label: input.documentTypeLabel ?? null,
          file_url: pub.publicUrl,
          file_name: input.file.name,
          issue_date: input.issueDate ?? null,
          expiration_date: input.expirationDate ?? null,
          notes: input.notes ?? null,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data as StudentDocument;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["student-documents", vars.studentId] });
      toast.success("Documento enviado");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao enviar documento"),
  });
}

export interface StudentInvoice {
  id: string;
  student_id: string;
  tenant_id: string;
  due_date: string;
  amount_cents: number;
  status: string;
  gateway: string | null;
  gateway_ref: string | null;
  pix_qr: string | null;
  pix_qr_base64: string | null;
  url_boleto: string | null;
  paid_at: string | null;
  description: string | null;
  created_at: string;
}

export function useStudentInvoices(studentId: string | undefined | null) {
  return useQuery({
    queryKey: ["student-invoices", studentId],
    queryFn: async (): Promise<StudentInvoice[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, student_id, tenant_id, due_date, amount_cents, status, gateway, gateway_ref, pix_qr, pix_qr_base64, url_boleto, paid_at, description, created_at",
        )
        .eq("student_id", studentId)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentInvoice[];
    },
    enabled: !!studentId,
  });
}

/** Gera PIX manualmente para uma fatura pending → chama edge generate-receivable-pix. */
export function useGenerateInvoicePix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await supabase.functions.invoke("generate-receivable-pix", {
        body: { invoice_id: invoiceId },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao gerar PIX");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-invoices"] });
      qc.invalidateQueries({ queryKey: ["aluno-detalhe"] });
      toast.success("Cobrança gerada");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao cobrar manualmente"),
  });
}
