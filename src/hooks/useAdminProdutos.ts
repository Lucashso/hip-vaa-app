// useAdminProdutos — produtos da loja do tenant (query + mutations).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

export interface ProdutoInput {
  name: string;
  description: string | null;
  type: string;
  price_cents: number;
  stock_quantity: number | null;
  photo_url: string | null;
}

export function useAdminProdutos(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "produtos", tenantId],
    queryFn: async (): Promise<AdminProduto[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, tenant_id, name, description, photo_url, type, price_cents, sizes, stock_quantity, active",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminProduto[];
    },
    enabled: !!tenantId,
  });
}

export async function uploadProductPhoto(tenantId: string, file: File): Promise<string> {
  const path = `${tenantId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

export function useCreateProduto(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      photoFile,
    }: {
      input: ProdutoInput;
      photoFile: File | null;
    }) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      let photo_url = input.photo_url;
      if (photoFile) {
        photo_url = await uploadProductPhoto(tenantId, photoFile);
      }
      const { error } = await supabase.from("products").insert({
        tenant_id: tenantId,
        name: input.name,
        description: input.description,
        photo_url,
        type: input.type,
        price_cents: input.price_cents,
        stock_quantity: input.stock_quantity,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
      toast.success("Produto criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar produto: " + err.message),
  });
}

export function useUpdateProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenantId,
      input,
      photoFile,
    }: {
      id: string;
      tenantId: string | null;
      input: ProdutoInput;
      photoFile: File | null;
    }) => {
      let photo_url = input.photo_url;
      if (photoFile && tenantId) {
        photo_url = await uploadProductPhoto(tenantId, photoFile);
      }
      const { error } = await supabase
        .from("products")
        .update({
          name: input.name,
          description: input.description,
          photo_url,
          type: input.type,
          price_cents: input.price_cents,
          stock_quantity: input.stock_quantity,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
      toast.success("Produto atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar produto: " + err.message),
  });
}

export function useDeleteProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
      toast.success("Produto excluído");
    },
    onError: (err: Error) => toast.error("Erro ao excluir: " + err.message),
  });
}

export function useToggleProdutoActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "produtos"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}
