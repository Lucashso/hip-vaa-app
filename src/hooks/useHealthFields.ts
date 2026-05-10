// useHealthFields — perguntas do questionário de saúde do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface HealthField {
  id: string;
  tenant_id: string;
  label: string;
  section: string | null;
  icon_name: string | null;
  has_details: boolean;
  is_critical: boolean;
  sort_order: number | null;
  field_type: string | null;
  unit: string | null;
}

export function useHealthFields(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "health-fields", tenantId],
    queryFn: async (): Promise<HealthField[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("health_questionnaire_fields")
        .select("id, tenant_id, label, section, icon_name, has_details, is_critical, sort_order, field_type, unit")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as HealthField[];
    },
    enabled: !!tenantId,
  });
}
