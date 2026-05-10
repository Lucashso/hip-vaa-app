// Hooks de pedidos da loja do aluno.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ProductOrder {
  id: string;
  tenant_id: string;
  product_id: string;
  student_id: string | null;
  size: string | null;
  quantity: number;
  amount_cents: number;
  status: string;
  invoice_id: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  customer_name: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    photo_url: string | null;
    type: string | null;
    price_cents: number;
  } | null;
}

/** Pedidos da loja feitos pelo aluno. */
export function useMyOrders(studentId?: string) {
  return useQuery({
    queryKey: ["my-orders", studentId],
    queryFn: async (): Promise<ProductOrder[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("product_orders")
        .select(
          "*, product:products(id, name, description, photo_url, type, price_cents)",
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ProductOrder[]) ?? [];
    },
    enabled: !!studentId,
  });
}
