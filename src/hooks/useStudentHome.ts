// useStudentHome — consolida dados pra Home do aluno em um único hook.
// Junta student, próxima aula, check-ins, banners, settings e flags do tenant.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useTenant, type TenantSettings } from "./useTenant";
import {
  useMyStudent,
  useMyEnrolledClasses,
  useMyMonthlyCheckins,
  useMyCredits,
  type ClassRow,
  type Invoice,
} from "./useStudent";
import { useTodayCheckins, type CheckinRow } from "./useCheckins";
import { useStudentBanners, type StudentBanner } from "./useStudentBanners";

export interface UpcomingClass {
  class: ClassRow;
  date: Date; // data efetiva (hoje ou amanhã)
  isToday: boolean;
  isTomorrow: boolean;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  // Semana começa no domingo (0).
  date.setDate(date.getDate() - date.getDay());
  return date;
}

/** Próxima fatura pendente/atrasada do aluno (ordenada por due_date asc). */
export function useUpcomingStudentInvoice(studentId?: string) {
  return useQuery({
    queryKey: ["upcoming-student-invoice", studentId],
    queryFn: async (): Promise<Invoice | null> => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("student_id", studentId)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Invoice) ?? null;
    },
    enabled: !!studentId,
  });
}

/** Conta check-ins do aluno na semana corrente (domingo 0:00 → próximo domingo). */
export function useWeeklyCheckinCount(studentId?: string) {
  return useQuery({
    queryKey: ["weekly-checkin-count", studentId],
    queryFn: async (): Promise<number> => {
      if (!studentId) return 0;
      const start = startOfWeek(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const { count, error } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .gte("ts", start.toISOString())
        .lt("ts", end.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!studentId,
  });
}

/**
 * Conta check-ins marcados como reposição ('replacement') no período configurado.
 * Como hipvaa não tem coluna `is_replacement`, usamos método 'replacement' como
 * proxy quando settings.class_replacement_enabled = true.
 */
export function useReplacementCheckinCount(
  studentId?: string,
  period: "calendar" | "billing_cycle" = "calendar",
  enabled = true,
) {
  return useQuery({
    queryKey: ["replacement-checkin-count", studentId, period],
    queryFn: async (): Promise<number> => {
      if (!studentId) return 0;
      const start = new Date();
      if (period === "calendar") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      } else {
        // billing_cycle — sem dado preciso de ciclo aqui, usar 30 dias.
        start.setDate(start.getDate() - 30);
      }
      const { count, error } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("method", "replacement")
        .gte("ts", start.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: enabled && !!studentId,
  });
}

/** Hook agregador da Home do aluno. */
export function useStudentHome() {
  const { profile, user: _user } = useAuth();
  void _user;
  const tenant = useTenant();
  const settings: TenantSettings = tenant.settings;
  const featureFlags = tenant.featureFlags;

  const studentQ = useMyStudent();
  const student = studentQ.data ?? null;

  const enrolledQ = useMyEnrolledClasses(student?.id);
  const enrolled = enrolledQ.data ?? [];

  const todayCheckinsQ = useTodayCheckins(student?.id);
  const todayCheckins: CheckinRow[] = todayCheckinsQ.data ?? [];

  const monthlyCheckinsQ = useMyMonthlyCheckins(student?.id);
  const monthlyCheckins = monthlyCheckinsQ.data ?? 0;

  const weeklyCheckinsQ = useWeeklyCheckinCount(student?.id);
  const weeklyCheckins = weeklyCheckinsQ.data ?? 0;

  const creditsQ = useMyCredits(student?.id);
  const credits = creditsQ.data ?? { available_cents: 0 };

  const invoiceQ = useUpcomingStudentInvoice(student?.id);
  const upcomingInvoice = invoiceQ.data ?? null;

  const bannersQ = useStudentBanners(profile?.tenant_id);
  const banners: StudentBanner[] = bannersQ.data ?? [];

  // Reposição — só busca se feature ligada.
  const replacementQ = useReplacementCheckinCount(
    student?.id,
    settings.replacement_period,
    settings.class_replacement_enabled,
  );
  const replacementCount = replacementQ.data ?? 0;

  // --- Próxima aula matriculada hoje/amanhã, respeitando checkin_day_mode ---
  const upcoming = useMemo<UpcomingClass | null>(() => {
    if (enrolled.length === 0) return null;
    const now = new Date();
    const todayWeekday = now.getDay();
    const tomorrowWeekday = (todayWeekday + 1) % 7;
    const mode = settings.checkin_day_mode;

    const todayClasses = enrolled
      .filter((c) => c.weekday === todayWeekday)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    const tomorrowClasses = enrolled
      .filter((c) => c.weekday === tomorrowWeekday)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    // Filtra aulas de hoje que ainda não passaram do horário de início.
    const futureToday = todayClasses.filter((c) => {
      if (!c.start_time) return true;
      const [h, m] = c.start_time.split(":").map(Number);
      const classTime = new Date(now);
      classTime.setHours(h, m, 0, 0);
      // Considera "ainda válida" se faltar até 60min do início.
      return classTime.getTime() > now.getTime() - 60 * 60 * 1000;
    });

    if (mode === "today_only") {
      const c = futureToday[0] ?? todayClasses[0];
      if (!c) return null;
      return { class: c, date: new Date(now), isToday: true, isTomorrow: false };
    }

    // multi_day e dynamic: priorizam hoje, caem pra amanhã se nada hoje.
    if (futureToday[0]) {
      return { class: futureToday[0], date: new Date(now), isToday: true, isTomorrow: false };
    }
    if (todayClasses[0]) {
      return { class: todayClasses[0], date: new Date(now), isToday: true, isTomorrow: false };
    }
    if (tomorrowClasses[0]) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        class: tomorrowClasses[0],
        date: tomorrow,
        isToday: false,
        isTomorrow: true,
      };
    }
    return null;
  }, [enrolled, settings.checkin_day_mode]);

  // --- Status financeiro derivado ---
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const tolerance = settings.delinquency_tolerance_days ?? 1;

  const isOverdue = !!(
    upcomingInvoice &&
    (upcomingInvoice.status === "overdue" ||
      (upcomingInvoice.status === "pending" &&
        new Date(upcomingInvoice.due_date) < today))
  );

  let daysOverdue = 0;
  if (upcomingInvoice && isOverdue) {
    const diff = today.getTime() - new Date(upcomingInvoice.due_date).getTime();
    daysOverdue = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  const isDelinquent =
    student?.status === "delinquent" || daysOverdue > tolerance;

  const daysUntilDue = upcomingInvoice
    ? Math.floor(
        (new Date(upcomingInvoice.due_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Status textual pro header
  let statusLabel: "Em dia" | "Pendente" | "Inadimplente" = "Em dia";
  let statusColor = "hsl(var(--hv-leaf))";
  if (isDelinquent) {
    statusLabel = "Inadimplente";
    statusColor = "hsl(var(--hv-coral))";
  } else if (upcomingInvoice && upcomingInvoice.status !== "paid") {
    statusLabel = "Pendente";
    statusColor = "hsl(var(--hv-amber))";
  }

  // Próxima aula tem check-in feito hoje?
  const upcomingCheckedIn = useMemo(() => {
    if (!upcoming || !upcoming.isToday) return false;
    return todayCheckins.some((c) => c.class_id === upcoming.class.id);
  }, [upcoming, todayCheckins]);

  return {
    // Auth + tenant
    profile,
    tenant: tenant.data,
    settings,
    featureFlags,

    // Student
    student,
    isLoading:
      studentQ.isLoading ||
      tenant.isLoading ||
      enrolledQ.isLoading ||
      invoiceQ.isLoading,

    // Aulas
    enrolled,
    upcoming,
    upcomingCheckedIn,

    // Check-ins
    todayCheckins,
    monthlyCheckins,
    weeklyCheckins,
    replacementCount,

    // Créditos
    credits,

    // Banners
    banners,

    // Faturas
    upcomingInvoice,
    isOverdue,
    isDelinquent,
    daysOverdue,
    daysUntilDue,
    statusLabel,
    statusColor,
  };
}
