// useTenant — info da filial do usuário + settings da operação.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  domain: string | null;
  active: boolean;
  partnership_whatsapp: string | null;
  drop_in_price_cents: number | null;
  contract_text: string | null;
  settings_json: Record<string, unknown> | null;
}

export function useTenant() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["tenant", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!profile?.tenant_id,
  });
}
