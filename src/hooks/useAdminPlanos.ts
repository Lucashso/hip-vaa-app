// useAdminPlanos — lista de planos do tenant (admin).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminPlano {
  id: string;
  tenant_id: string;
  name: string;
  type: string | null;
  price_cents: number;
  billing_cycle_days: number | null;
  classes_per_week: number | null;
  active: boolean;
  display_order: number | null;
  payment_config: Record<string, unknown> | null;
  rules_json: Record<string, unknown> | null;
}

export function useAdminPlanos(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "planos", tenantId],
    queryFn: async (): Promise<AdminPlano[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminPlano[];
    },
    enabled: !!tenantId,
  });
}
