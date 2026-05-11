// useSignupLinks — CRUD para signup_links (links de cadastro com plano/pagamento/desconto).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface SignupLink {
  id: string;
  tenant_id: string | null;
  plan_id: string | null;
  payment_methods: string[] | null;
  discount_percent: number | null;
  discount_cents: number | null;
  tracking_code: string | null;
  expires_at: string | null;
  active: boolean;
  uses_count: number | null;
  max_uses: number | null;
  created_at: string;
  slug: string | null;
  notes: string | null;
}

export interface CreateSignupLinkPayload {
  tenant_id?: string | null;
  plan_id?: string | null;
  payment_methods?: string[];
  discount_percent?: number | null;
  discount_cents?: number | null;
  tracking_code?: string | null;
  expires_at?: string | null;
  active?: boolean;
  max_uses?: number | null;
  notes?: string | null;
  slug?: string | null;
}

const QK = (tenantId?: string) => ["signup-links", tenantId ?? "all"];

export function useSignupLinks(tenantId?: string) {
  return useQuery({
    queryKey: QK(tenantId),
    queryFn: async (): Promise<SignupLink[]> => {
      let q = supabase
        .from("signup_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as SignupLink[]) ?? [];
    },
  });
}

export function useCreateSignupLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSignupLinkPayload): Promise<SignupLink> => {
      const { data, error } = await supabase
        .from("signup_links")
        .insert({ ...payload, active: payload.active ?? true })
        .select()
        .single();
      if (error) throw error;
      return data as SignupLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signup-links"] });
      toast.success("Link de cadastro criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar link: " + err.message),
  });
}

export function useUpdateSignupLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<SignupLink> & { id: string }) => {
      const { data, error } = await supabase
        .from("signup_links")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as SignupLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signup-links"] });
      toast.success("Link atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar: " + err.message),
  });
}

export function useDeleteSignupLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("signup_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signup-links"] });
      toast.success("Link removido");
    },
    onError: (err: Error) => toast.error("Erro ao remover: " + err.message),
  });
}

export function useToggleSignupLinkActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("signup_links")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signup-links"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}
