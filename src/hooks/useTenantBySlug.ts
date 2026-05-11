// useTenantBySlug — busca tenant público por slug (com fallback p/ primeiro tenant ativo).
// usePublicPlans — planos públicos visíveis no signup.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PublicTenant {
  id: string;
  name: string;
  slug: string | null;
  logo_url?: string | null;
  contract_text: string | null;
  drop_in_contract_text: string | null;
  drop_in_price_cents: number | null;
  settings_json: Record<string, unknown> | null;
}

export interface PublicPlan {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  price_cents: number;
  signup_fee_cents: number | null;
  classes_per_week: number | null;
  payment_frequency: string | null;
  frequency_count: number | null;
  active: boolean | null;
  display_order: number;
  visible_on_signup: boolean;
  rules_json: Record<string, unknown> | null;
}

/** Busca tenant por slug. Se slug nulo, retorna primeiro tenant ativo (fallback dev). */
export function useTenantBySlug(slug?: string) {
  return useQuery({
    queryKey: ["tenant-by-slug", slug ?? "__first__"],
    queryFn: async (): Promise<PublicTenant | null> => {
      if (slug) {
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name, slug, contract_text, drop_in_contract_text, drop_in_price_cents, settings_json")
          .eq("slug", slug)
          .eq("active", true)
          .maybeSingle();
        if (error) throw error;
        if (data) return data as PublicTenant;
      }
      // Fallback dev: primeiro tenant ativo.
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, contract_text, drop_in_contract_text, drop_in_price_cents, settings_json")
        .eq("active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as PublicTenant) ?? null;
    },
  });
}

export function usePublicPlans(tenantId?: string) {
  return useQuery({
    queryKey: ["public-plans", tenantId],
    queryFn: async (): Promise<PublicPlan[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id, tenant_id, name, type, price_cents, signup_fee_cents, classes_per_week, payment_frequency, frequency_count, active, display_order, visible_on_signup, rules_json",
        )
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .eq("visible_on_signup", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as PublicPlan[]) ?? [];
    },
    enabled: !!tenantId,
  });
}
