// useProducts — produtos ativos do tenant + criar pedido com PIX.

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ProductSizeStock {
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  type: string;
  price_cents: number;
  sizes: unknown[] | null;
  stock_quantity: number | null;
  order_deadline: string | null;
  estimated_delivery: string | null;
  active: boolean | null;
}

export interface CreateOrderResult {
  success?: boolean;
  pix_available?: boolean;
  pix_qr?: string;
  pix_qr_base64?: string;
  order_id: string;
  amount_cents: number;
  product_name: string;
  error?: string;
}

/** Lista produtos ativos do tenant. */
export function useActiveProducts(tenantId?: string) {
  return useQuery({
    queryKey: ["active-products", tenantId],
    queryFn: async (): Promise<Product[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, tenant_id, name, description, photo_url, type, price_cents, sizes, stock_quantity, order_deadline, estimated_delivery, active")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Product[]) ?? [];
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

/** Helpers de tamanho (suporta formato novo [{size, quantity}] e antigo [string]). */
export function parseSizes(product: Product): { sizeStocks: ProductSizeStock[]; simpleSizes: string[] } {
  if (!product.sizes) return { sizeStocks: [], simpleSizes: [] };
  const sizes = product.sizes;
  if (sizes.length === 0) return { sizeStocks: [], simpleSizes: [] };
  if (typeof sizes[0] === "object" && sizes[0] !== null && "size" in (sizes[0] as object)) {
    return { sizeStocks: sizes as ProductSizeStock[], simpleSizes: [] };
  }
  return { sizeStocks: [], simpleSizes: sizes as string[] };
}

export function getAvailableSizes(product: Product): { size: string; quantity: number | null; disabled: boolean }[] {
  const { sizeStocks, simpleSizes } = parseSizes(product);
  if (product.type === "stock" && sizeStocks.length > 0) {
    return sizeStocks.map((s) => ({ size: s.size, quantity: s.quantity, disabled: s.quantity <= 0 }));
  }
  return simpleSizes.map((size) => ({ size, quantity: null, disabled: false }));
}

/** Cria order via edge function. Retorna PIX inline. */
export function useCreateProductOrder() {
  return useMutation({
    mutationFn: async ({
      productId,
      size,
      quantity,
    }: {
      productId: string;
      size: string | null;
      quantity: number;
    }): Promise<CreateOrderResult> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke("create-product-order", {
        body: { product_id: productId, size: size || null, quantity },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as CreateOrderResult;
    },
    onError: (err: Error) => {
      console.error("createProductOrder", err);
      toast.error(err.message || "Erro ao criar pedido");
    },
  });
}
