// useTenant — info da filial do usuário + settings + mutations.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
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
  drop_in_contract_text: string | null;
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

export function useUpdateTenantContracts() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async ({
      contract_text,
      drop_in_contract_text,
    }: {
      contract_text?: string;
      drop_in_contract_text?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const payload: Record<string, string> = {};
      if (contract_text !== undefined) payload.contract_text = contract_text;
      if (drop_in_contract_text !== undefined)
        payload.drop_in_contract_text = drop_in_contract_text;
      const { error } = await supabase
        .from("tenants")
        .update(payload)
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Termos atualizados!");
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });
}

export function useUpdateTenantSettings() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const { data: current, error: fetchErr } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", profile.tenant_id)
        .single();
      if (fetchErr) throw fetchErr;
      const merged = {
        ...(current?.settings_json as Record<string, unknown> | null ?? {}),
        ...patch,
      };
      const { error } = await supabase
        .from("tenants")
        .update({ settings_json: merged })
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });
}
