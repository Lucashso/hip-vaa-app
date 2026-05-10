// Hooks de Parceiros do clube.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Partner {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  display_order: number | null;
  is_global: boolean | null;
}

export interface PartnerAction {
  id: string;
  partner_id: string;
  label: string;
  action_type: string;
  value: string | null;
  is_primary: boolean | null;
  display_order: number | null;
  whatsapp_message: string | null;
}

/** Parceiros ativos do tenant (mais globais). */
export function usePartners(tenantId?: string) {
  return useQuery({
    queryKey: ["partners", tenantId],
    queryFn: async (): Promise<Partner[]> => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("active", true)
        .or(
          tenantId
            ? `tenant_id.eq.${tenantId},is_global.eq.true`
            : `is_global.eq.true`,
        )
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as Partner[]) ?? [];
    },
  });
}

/** Ações dos parceiros listados. */
export function usePartnerActions(partnerIds: string[]) {
  return useQuery({
    queryKey: ["partner-actions", partnerIds.join(",")],
    queryFn: async (): Promise<PartnerAction[]> => {
      if (!partnerIds.length) return [];
      const { data, error } = await supabase
        .from("partner_actions")
        .select("*")
        .in("partner_id", partnerIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as PartnerAction[]) ?? [];
    },
    enabled: partnerIds.length > 0,
  });
}
