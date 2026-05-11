// useDelinquentStudents — alunos inadimplentes (vencido > tolerance_days).
// Agrega faturas pendentes vencidas por aluno e respeita delinquency_tolerance_days.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DelinquentInvoice {
  id: string;
  amount_cents: number;
  due_date: string;
  status: string;
}

export interface DelinquentStudent {
  student_id: string;
  user_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  plan_name: string | null;
  total_overdue_cents: number;
  oldest_due_date: string;
  days_late: number;
  invoices: DelinquentInvoice[];
}

/**
 * useDelinquentStudents — lista de alunos inadimplentes respeitando tolerance_days
 * configurado no tenant.settings_json.delinquency_tolerance_days (default 1).
 */
export function useDelinquentStudents(tenantId: string | undefined | null) {
  return useQuery({
    queryKey: ["delinquent-students", tenantId],
    queryFn: async (): Promise<DelinquentStudent[]> => {
      if (!tenantId) return [];

      // Busca tolerância do tenant
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", tenantId)
        .maybeSingle();

      const settings = (tenantRow?.settings_json as Record<string, unknown> | null) ?? {};
      const tolDays = typeof settings.delinquency_tolerance_days === "number"
        ? settings.delinquency_tolerance_days
        : 1;

      // Calcula data limite (today - tolDays). Faturas vencidas há > tolDays.
      const limit = new Date();
      limit.setDate(limit.getDate() - tolDays);
      const limitStr = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, "0")}-${String(limit.getDate()).padStart(2, "0")}`;

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(
          "id, student_id, amount_cents, due_date, status, " +
            "student:students!invoices_student_id_fkey(id, user_id, plan:plans(name), profile:profiles!students_user_id_profiles_fkey(full_name, phone, email))",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .lt("due_date", limitStr)
        .order("due_date", { ascending: true })
        .limit(500);
      if (error) throw error;

      const now = new Date();
      type Row = {
        id: string;
        student_id: string;
        amount_cents: number;
        due_date: string;
        status: string;
        student:
          | {
              id: string;
              user_id: string | null;
              plan: { name: string } | { name: string }[] | null;
              profile:
                | { full_name: string | null; phone: string | null; email: string | null }
                | { full_name: string | null; phone: string | null; email: string | null }[]
                | null;
            }
          | {
              id: string;
              user_id: string | null;
              plan: { name: string } | { name: string }[] | null;
              profile:
                | { full_name: string | null; phone: string | null; email: string | null }
                | { full_name: string | null; phone: string | null; email: string | null }[]
                | null;
            }[]
          | null;
      };

      const map = new Map<string, DelinquentStudent>();
      ((invoices ?? []) as unknown as Row[]).forEach((inv) => {
        const st = Array.isArray(inv.student) ? inv.student[0] ?? null : inv.student;
        const profile = st ? (Array.isArray(st.profile) ? st.profile[0] ?? null : st.profile) : null;
        const plan = st ? (Array.isArray(st.plan) ? st.plan[0] ?? null : st.plan) : null;

        const existing = map.get(inv.student_id);
        const dueIso = inv.due_date;
        if (!existing) {
          const due = new Date(dueIso);
          const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
          map.set(inv.student_id, {
            student_id: inv.student_id,
            user_id: st?.user_id ?? null,
            full_name: profile?.full_name ?? null,
            phone: profile?.phone ?? null,
            email: profile?.email ?? null,
            plan_name: plan?.name ?? null,
            total_overdue_cents: inv.amount_cents,
            oldest_due_date: dueIso,
            days_late: days,
            invoices: [{ id: inv.id, amount_cents: inv.amount_cents, due_date: inv.due_date, status: inv.status }],
          });
        } else {
          existing.total_overdue_cents += inv.amount_cents;
          existing.invoices.push({
            id: inv.id,
            amount_cents: inv.amount_cents,
            due_date: inv.due_date,
            status: inv.status,
          });
          if (dueIso < existing.oldest_due_date) {
            existing.oldest_due_date = dueIso;
            const due = new Date(dueIso);
            existing.days_late = Math.max(
              0,
              Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
            );
          }
        }
      });

      return Array.from(map.values()).sort((a, b) => b.total_overdue_cents - a.total_overdue_cents);
    },
    enabled: !!tenantId,
  });
}

