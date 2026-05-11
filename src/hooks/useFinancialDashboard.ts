// useFinancialDashboard — KPIs financeiros, recebimentos, MRR, gráfico de receita.
// Adaptado do lemehub para o schema Hip Va'a.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface MonthlyRevenuePoint {
  month: string; // YYYY-MM
  short: string; // ex.: "JAN"
  revenue_cents: number;
}

export interface FinancialKpis {
  mrr_cents: number;
  revenue_month_cents: number;
  receivable_cents: number;
  overdue_cents: number;
  overdue_count: number;
  expenses_cents: number;
  profit_cents: number;
  churn_pct: number;
  paid_count: number;
  pending_count: number;
  overdue_inv_count: number;
  paid_pct: number;
  pending_pct: number;
  overdue_pct: number;
}

export interface FinancialDashboardData {
  kpis: FinancialKpis;
  revenueByMonth: MonthlyRevenuePoint[];
}

const MONTH_SHORT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

function normalizeMonthlyMRR(priceCents: number, planType: string | null): number {
  switch (planType) {
    case "trimestral": return Math.round(priceCents / 3);
    case "semestral": return Math.round(priceCents / 6);
    case "anual": return Math.round(priceCents / 12);
    case "avulso": return 0;
    default: return priceCents;
  }
}

/**
 * useFinancialDashboard — KPIs + série de receita mensal por filial/period.
 * period = "current" | "last3m" | "last6m" | "last12m"
 */
export function useFinancialDashboard(
  tenantId: string | undefined | null,
  period: "current" | "last3m" | "last6m" | "last12m" = "current",
) {
  return useQuery({
    queryKey: ["financial-dashboard", tenantId, period],
    queryFn: async (): Promise<FinancialDashboardData> => {
      const empty: FinancialDashboardData = {
        kpis: {
          mrr_cents: 0,
          revenue_month_cents: 0,
          receivable_cents: 0,
          overdue_cents: 0,
          overdue_count: 0,
          expenses_cents: 0,
          profit_cents: 0,
          churn_pct: 0,
          paid_count: 0,
          pending_count: 0,
          overdue_inv_count: 0,
          paid_pct: 0,
          pending_pct: 0,
          overdue_pct: 0,
        },
        revenueByMonth: [],
      };
      if (!tenantId) return empty;

      const now = new Date();
      const today = todayStr();
      const monthsBack =
        period === "last3m" ? 3
          : period === "last6m" ? 6
            : period === "last12m" ? 12
              : 1;

      const oldest = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
      const oldestStr = `${oldest.getFullYear()}-${String(oldest.getMonth() + 1).padStart(2, "0")}-01`;

      // Faturas no range estendido (todas serão usadas pro gráfico + KPI do mês corrente)
      const { data: invoices, error: invErr } = await supabase
        .from("invoices")
        .select("id, amount_cents, status, due_date, paid_at, created_at")
        .eq("tenant_id", tenantId)
        .gte("due_date", oldestStr)
        .order("due_date", { ascending: false })
        .limit(2000);
      if (invErr) throw invErr;

      // Alunos ativos pra MRR
      const { data: students, error: stErr } = await supabase
        .from("students")
        .select("id, status, is_scholarship, plan:plans(id, name, price_cents, type)")
        .eq("tenant_id", tenantId);
      if (stErr) throw stErr;

      const list = invoices ?? [];

      // KPIs do mês corrente
      const { start: mStart, end: mEnd } = monthRange(now.getFullYear(), now.getMonth());
      let paidCount = 0;
      let pendingCount = 0;
      let overdueInvCount = 0;
      let revenueMonth = 0;
      let receivable = 0;
      let overdue = 0;

      // Mapa do gráfico (months ordenados)
      const monthlyMap = new Map<string, number>();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(k, 0);
      }

      list.forEach((inv) => {
        // Gráfico — usa paid_at se pago, senão due_date como projeção?
        // Lemehub usa paid_at pra receita realizada. Vamos seguir.
        if (inv.status === "paid" && inv.paid_at) {
          const pd = new Date(inv.paid_at);
          const k = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
          if (monthlyMap.has(k)) {
            monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + inv.amount_cents);
          }
        }

        // KPIs mês corrente — filtra por due_date no mês
        if (inv.due_date >= mStart && inv.due_date <= mEnd) {
          if (inv.status === "paid") {
            paidCount += 1;
            revenueMonth += inv.amount_cents;
          } else if (inv.status === "pending") {
            if (inv.due_date < today) {
              overdueInvCount += 1;
              overdue += inv.amount_cents;
            } else {
              pendingCount += 1;
              receivable += inv.amount_cents;
            }
          }
        } else if (inv.status === "pending" && inv.due_date < today) {
          // Vencidas de meses anteriores ainda contam
          overdueInvCount += 1;
          overdue += inv.amount_cents;
        }
      });

      // MRR — soma normalizada pelos alunos ativos (sem bolsistas)
      let mrr = 0;
      (students ?? []).forEach((s) => {
        const status = (s as unknown as { status: string }).status;
        const isSch = (s as unknown as { is_scholarship: boolean }).is_scholarship;
        if (status !== "active" || isSch) return;
        const planArr = (s as unknown as { plan: { price_cents: number; type: string | null } | { price_cents: number; type: string | null }[] | null }).plan;
        const plan = Array.isArray(planArr) ? planArr[0] ?? null : planArr;
        if (!plan) return;
        mrr += normalizeMonthlyMRR(plan.price_cents, plan.type);
      });

      // Churn — alunos inativos no mês / total no início do mês.
      // Sem histórico granular, aproxima como (inactive count) / (active+inactive) * 100.
      const totalSt = (students ?? []).length;
      const inactiveSt = (students ?? []).filter((s) => (s as unknown as { status: string }).status === "inactive").length;
      const churnPct = totalSt > 0 ? Math.round((inactiveSt / totalSt) * 1000) / 10 : 0;

      const totalStatus = paidCount + pendingCount + overdueInvCount;
      const paidPct = totalStatus > 0 ? Math.round((paidCount / totalStatus) * 100) : 0;
      const pendingPct = totalStatus > 0 ? Math.round((pendingCount / totalStatus) * 100) : 0;
      const overduePct = totalStatus > 0 ? Math.max(0, 100 - paidPct - pendingPct) : 0;

      // Despesas: placeholder (sem tabela específica ainda) — futuro: payables
      // Mantemos 0 por enquanto; se houver tabela `payables` futura, somar.
      const expenses = 0;
      const profit = revenueMonth - expenses;

      const revenueByMonth: MonthlyRevenuePoint[] = Array.from(monthlyMap.entries()).map(([k, v]) => {
        const [_y, m] = k.split("-");
        return {
          month: k,
          short: MONTH_SHORT[Number(m) - 1] ?? m,
          revenue_cents: v,
        };
      });

      return {
        kpis: {
          mrr_cents: mrr,
          revenue_month_cents: revenueMonth,
          receivable_cents: receivable,
          overdue_cents: overdue,
          overdue_count: overdueInvCount,
          expenses_cents: expenses,
          profit_cents: profit,
          churn_pct: churnPct,
          paid_count: paidCount,
          pending_count: pendingCount,
          overdue_inv_count: overdueInvCount,
          paid_pct: paidPct,
          pending_pct: pendingPct,
          overdue_pct: overduePct,
        },
        revenueByMonth,
      };
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

// ----------------- Recent payments + Overdue list + Revenue chart isolado -----------------

export interface RecentPayment {
  id: string;
  amount_cents: number;
  paid_at: string;
  student_name: string | null;
  description: string | null;
}

export function useRecentPayments(tenantId: string | undefined | null, limit = 10) {
  return useQuery({
    queryKey: ["recent-payments", tenantId, limit],
    queryFn: async (): Promise<RecentPayment[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, amount_cents, paid_at, description, " +
            "student:students!invoices_student_id_fkey(id, profile:profiles!students_user_id_profiles_fkey(full_name))",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "paid")
        .not("paid_at", "is", null)
        .order("paid_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      type Row = {
        id: string;
        amount_cents: number;
        paid_at: string;
        description: string | null;
        student:
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]
          | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => {
        const st = Array.isArray(r.student) ? r.student[0] ?? null : r.student;
        const p = st ? (Array.isArray(st.profile) ? st.profile[0] ?? null : st.profile) : null;
        return {
          id: r.id,
          amount_cents: r.amount_cents,
          paid_at: r.paid_at,
          description: r.description,
          student_name: p?.full_name ?? null,
        };
      });
    },
    enabled: !!tenantId,
  });
}

export interface OverdueInvoice {
  id: string;
  student_id: string;
  amount_cents: number;
  due_date: string;
  days_late: number;
  student_name: string | null;
}

export function useOverdueInvoices(tenantId: string | undefined | null) {
  return useQuery({
    queryKey: ["overdue-invoices", tenantId],
    queryFn: async (): Promise<OverdueInvoice[]> => {
      if (!tenantId) return [];
      const t = todayStr();
      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, student_id, amount_cents, due_date, " +
            "student:students!invoices_student_id_fkey(id, profile:profiles!students_user_id_profiles_fkey(full_name))",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .lt("due_date", t)
        .order("due_date", { ascending: true })
        .limit(100);
      if (error) throw error;

      const now = new Date();
      type Row = {
        id: string;
        student_id: string;
        amount_cents: number;
        due_date: string;
        student:
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }
          | { id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]
          | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => {
        const st = Array.isArray(r.student) ? r.student[0] ?? null : r.student;
        const p = st ? (Array.isArray(st.profile) ? st.profile[0] ?? null : st.profile) : null;
        const due = new Date(r.due_date);
        const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: r.id,
          student_id: r.student_id,
          amount_cents: r.amount_cents,
          due_date: r.due_date,
          days_late: days,
          student_name: p?.full_name ?? null,
        };
      });
    },
    enabled: !!tenantId,
  });
}

/** useRevenueChart — MRR/receita por mês com X meses pra trás. Reaproveita do hook principal mas isolado. */
export function useRevenueChart(tenantId: string | undefined | null, months = 6) {
  return useQuery({
    queryKey: ["revenue-chart", tenantId, months],
    queryFn: async (): Promise<MonthlyRevenuePoint[]> => {
      if (!tenantId) return [];
      const now = new Date();
      const oldest = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      const oldestStr = `${oldest.getFullYear()}-${String(oldest.getMonth() + 1).padStart(2, "0")}-01`;

      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount_cents, status, paid_at")
        .eq("tenant_id", tenantId)
        .eq("status", "paid")
        .gte("paid_at", `${oldestStr}T00:00:00`)
        .limit(2000);
      if (error) throw error;

      const map = new Map<string, number>();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map.set(k, 0);
      }
      (data ?? []).forEach((inv) => {
        if (!inv.paid_at) return;
        const pd = new Date(inv.paid_at);
        const k = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + inv.amount_cents);
      });
      return Array.from(map.entries()).map(([k, v]) => {
        const m = Number(k.split("-")[1]);
        return { month: k, short: MONTH_SHORT[m - 1] ?? "", revenue_cents: v };
      });
    },
    enabled: !!tenantId,
  });
}
