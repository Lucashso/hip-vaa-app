// useDropInClasses — lista turmas disponíveis pra um drop-in agendar.
// Junta `classes` (recorrentes, por weekday) + venues + contagem de checkins
// já registrados para cada (class_id, data) para filtrar com vagas.
//
// Recebe `dateFrom` (yyyy-mm-dd) e olha os próximos 7 dias por padrão.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DropInClassSlot {
  class_id: string;
  weekday: number;
  start_time: string; // HH:MM:SS
  end_time: string;
  max_capacity: number | null;
  venue: { id: string; name: string } | null;
}

export interface DropInDaySlot {
  /** yyyy-mm-dd */
  date: string;
  weekday: number; // 0..6 (Dom..Sáb)
  classes: Array<DropInClassSlot & { taken: number; available: number }>;
}

interface ClassesRow {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean | null;
  max_capacity: number | null;
  venue: { id: string; name: string } | { id: string; name: string }[] | null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Próximos `days` dias a partir de `dateFrom` (inclusive). */
export function useUpcomingDropInClasses(
  tenantId: string | null | undefined,
  dateFrom?: string,
  days = 7,
) {
  return useQuery({
    queryKey: ["upcoming-drop-in-classes", tenantId, dateFrom, days],
    enabled: !!tenantId,
    queryFn: async (): Promise<DropInDaySlot[]> => {
      if (!tenantId) return [];

      const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : new Date();
      // Normaliza pra início do dia local.
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + days);

      // 1. Busca turmas ativas do tenant
      const { data: classesRaw, error: classesErr } = await supabase
        .from("classes")
        .select(
          "id, weekday, start_time, end_time, active, max_capacity, venue:venues!inner(id, name, tenant_id)",
        )
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .eq("venues.tenant_id", tenantId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });

      if (classesErr) throw classesErr;

      const classes: DropInClassSlot[] = ((classesRaw ?? []) as ClassesRow[]).map((c) => {
        const venue = Array.isArray(c.venue) ? c.venue[0] ?? null : c.venue;
        return {
          class_id: c.id,
          weekday: c.weekday,
          start_time: c.start_time,
          end_time: c.end_time,
          max_capacity: c.max_capacity,
          venue: venue ? { id: venue.id, name: venue.name } : null,
        };
      });

      // 2. Conta check-ins por (class_id, dia) no intervalo. Pega janela suficiente.
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const { data: checkinsRaw, error: checkErr } = await supabase
        .from("checkins")
        .select("class_id, ts")
        .gte("ts", startISO)
        .lt("ts", endISO);

      if (checkErr) throw checkErr;

      const checkinCount = new Map<string, number>(); // key = `${class_id}|${dateStr}`
      for (const row of (checkinsRaw ?? []) as Array<{ class_id: string | null; ts: string }>) {
        if (!row.class_id) continue;
        const d = new Date(row.ts);
        const key = `${row.class_id}|${toDateOnly(d)}`;
        checkinCount.set(key, (checkinCount.get(key) ?? 0) + 1);
      }

      // 3. Conta drop-ins pendentes/aprovados já agendados naquele dia/aula.
      const startDateOnly = toDateOnly(start);
      const endDateOnly = toDateOnly(end);
      const { data: bookingsRaw, error: bookErr } = await supabase
        .from("drop_in_students")
        .select("scheduled_class_id, scheduled_class_date, booking_status")
        .eq("tenant_id", tenantId)
        .gte("scheduled_class_date", startDateOnly)
        .lt("scheduled_class_date", endDateOnly)
        .in("booking_status", ["pending", "approved"]);

      if (bookErr) throw bookErr;

      for (const row of (bookingsRaw ?? []) as Array<{
        scheduled_class_id: string | null;
        scheduled_class_date: string | null;
      }>) {
        if (!row.scheduled_class_id || !row.scheduled_class_date) continue;
        const key = `${row.scheduled_class_id}|${row.scheduled_class_date}`;
        checkinCount.set(key, (checkinCount.get(key) ?? 0) + 1);
      }

      // 4. Monta lista de dias × aulas com vagas.
      const result: DropInDaySlot[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = toDateOnly(d);
        const weekday = d.getDay();
        const classesOfDay = classes
          .filter((c) => c.weekday === weekday)
          .map((c) => {
            const taken = checkinCount.get(`${c.class_id}|${dateStr}`) ?? 0;
            const cap = c.max_capacity ?? null;
            const available = cap == null ? Infinity : Math.max(cap - taken, 0);
            return { ...c, taken, available };
          })
          .filter((c) => c.available > 0);

        result.push({ date: dateStr, weekday, classes: classesOfDay });
      }

      return result;
    },
  });
}
