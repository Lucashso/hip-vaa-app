// useImportantDates — datas importantes próximas (aniversariantes etc).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ImportantDate {
  id: string;
  tenant_id: string;
  student_id: string | null;
  date: string;
  title: string;
  description: string | null;
  type: string | null;
  student?: { id: string; profile?: { full_name: string } | null } | null;
}

export function useImportantDates(tenantId?: string | null, daysAhead = 30) {
  return useQuery({
    queryKey: ["admin", "important-dates", tenantId, daysAhead],
    queryFn: async (): Promise<ImportantDate[]> => {
      if (!tenantId) return [];
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("important_dates")
        .select("id, tenant_id, student_id, date, title, description, type")
        .eq("tenant_id", tenantId)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ImportantDate[];
    },
    enabled: !!tenantId,
  });
}
