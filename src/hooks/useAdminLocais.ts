// useAdminLocais — venues do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminLocal {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  default_capacity: number | null;
  active: boolean;
  geo_lat: number | null;
  geo_lng: number | null;
}

export function useAdminLocais(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "locais", tenantId],
    queryFn: async (): Promise<AdminLocal[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("venues")
        .select("id, tenant_id, name, address, default_capacity, active, geo_lat, geo_lng")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminLocal[];
    },
    enabled: !!tenantId,
  });
}
