// useAdminCanoas — frota de embarcações do tenant + venue.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminCanoa {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  photo_url: string | null;
  venue_id: string | null;
  venue?: { id: string; name: string } | null;
}

export function useAdminCanoas(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "canoas", tenantId],
    queryFn: async (): Promise<AdminCanoa[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("boats")
        .select("id, tenant_id, name, type, capacity, status, photo_url, venue_id, venue:venues(id, name)")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AdminCanoa[];
    },
    enabled: !!tenantId,
  });
}
