// useAdminPedidos — pedidos da loja do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminPedido {
  id: string;
  tenant_id: string;
  product_id: string;
  student_id: string | null;
  size: string | null;
  quantity: number;
  amount_cents: number;
  status: string;
  customer_name: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  product?: { id: string; name: string } | null;
  student?: { id: string; profile_id: string | null; profile?: { full_name: string } | null } | null;
}

export function useAdminPedidos(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "pedidos", tenantId],
    queryFn: async (): Promise<AdminPedido[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("product_orders")
        .select(
          "id, tenant_id, product_id, student_id, size, quantity, amount_cents, status, customer_name, created_at, paid_at, delivered_at, product:products(id, name)",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminPedido[];
    },
    enabled: !!tenantId,
  });
}
