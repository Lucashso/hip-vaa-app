// Hooks do aluno: dados pessoais, próximas aulas, faturas, créditos, resgates.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Student {
  id: string;
  user_id: string;
  tenant_id: string;
  status: "active" | "inactive" | "delinquent" | "pending";
  plan_id: string | null;
  invoice_due_day: number | null;
  is_scholarship: boolean;
}

export interface ClassRow {
  id: string;
  tenant_id: string;
  venue_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  venue?: { id: string; name: string; address: string | null } | null;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  student_id: string;
  due_date: string;
  amount_cents: number;
  status: "pending" | "paid" | "cancelled" | "overdue";
  paid_at: string | null;
  pix_qr: string | null;
  pix_qr_base64: string | null;
  description: string | null;
}

/** Student do usuário autenticado. */
export function useMyStudent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-student", user?.id],
    queryFn: async (): Promise<(Student & { plan: { id: string; name: string; price_cents: number; type: string } | null }) | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("students")
        .select("*, plan:plans(id, name, price_cents, type)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as never;
    },
    enabled: !!user?.id,
  });
}

/** Aulas em que o aluno está matriculado (active=true). */
export function useMyEnrolledClasses(studentId?: string) {
  return useQuery({
    queryKey: ["my-enrolled-classes", studentId],
    queryFn: async (): Promise<ClassRow[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select("classes(id, tenant_id, venue_id, weekday, start_time, end_time, active, venues(id, name, address))")
        .eq("student_id", studentId)
        .eq("active", true);
      if (error) throw error;
      // Supabase nested select retorna como array (mesmo pra 1:1) — pegamos [0].
      return ((data || []) as Array<{ classes: unknown }>)
        .map((e) => {
          const arr = Array.isArray(e.classes) ? e.classes : [e.classes];
          const c = arr[0] as (ClassRow & { venues?: ClassRow["venue"] | ClassRow["venue"][] }) | null;
          if (!c) return null;
          const venue = Array.isArray(c.venues) ? c.venues[0] ?? null : c.venues ?? null;
          return { ...c, venue } as ClassRow;
        })
        .filter((c): c is ClassRow => c !== null);
    },
    enabled: !!studentId,
  });
}

/** Faturas do aluno. */
export function useMyInvoices(studentId?: string) {
  return useQuery({
    queryKey: ["my-invoices", studentId],
    queryFn: async (): Promise<Invoice[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("student_id", studentId)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data as Invoice[]) ?? [];
    },
    enabled: !!studentId,
  });
}

/** Créditos disponíveis (referral). */
export function useMyCredits(studentId?: string) {
  return useQuery({
    queryKey: ["my-credits", studentId],
    queryFn: async () => {
      if (!studentId) return { available_cents: 0 };
      const { data, error } = await supabase
        .from("referral_credits")
        .select("amount_cents, used, expires_at")
        .eq("student_id", studentId);
      if (error) throw error;
      const now = new Date();
      const available = (data || [])
        .filter((c) => !c.used && (!c.expires_at || new Date(c.expires_at) > now))
        .reduce((s, c) => s + (c.amount_cents || 0), 0);
      return { available_cents: available };
    },
    enabled: !!studentId,
  });
}

/** Check-ins do mês corrente — pra mostrar streak/total. */
export function useMyMonthlyCheckins(studentId?: string) {
  return useQuery({
    queryKey: ["my-monthly-checkins", studentId],
    queryFn: async (): Promise<number> => {
      if (!studentId) return 0;
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .gte("ts", start.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!studentId,
  });
}
