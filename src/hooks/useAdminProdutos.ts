// useAdminProdutos — produtos da loja do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminProduto {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  type: string | null;
  price_cents: number;
  sizes: unknown;
  stock_quantity: number | null;
  active: boolean;
}

export function useAdminProdutos(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "produtos", tenantId],
    queryFn: async (): Promise<AdminProduto[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, tenant_id, name, description, photo_url, type, price_cents, sizes, stock_quantity, active")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminProduto[];
    },
    enabled: !!tenantId,
  });
}
