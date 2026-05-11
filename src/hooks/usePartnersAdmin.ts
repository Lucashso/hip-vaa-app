// usePartnersAdmin — CRUD parceiros + ações (admin) usando partner_tenants.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const PARTNER_ACTION_TYPES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "link", label: "Link" },
  { value: "coupon", label: "Cupom" },
] as const;

export type PartnerActionType = (typeof PARTNER_ACTION_TYPES)[number]["value"];

export interface PartnerAdmin {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  display_order: number | null;
  is_global: boolean | null;
}

export interface PartnerAdminAction {
  id: string;
  partner_id: string;
  label: string;
  action_type: PartnerActionType;
  value: string;
  is_primary: boolean | null;
  display_order: number | null;
  whatsapp_message: string | null;
}

export interface PartnerInput {
  name: string;
  description: string | null;
  logo_url: string | null;
  display_order: number;
}

export interface PartnerActionInput {
  label: string;
  action_type: PartnerActionType;
  value: string;
  is_primary: boolean;
  display_order: number;
  whatsapp_message: string | null;
}

/**
 * Parceiros atribuídos ao tenant (via partner_tenants) OU parceiros próprios (tenant_id = tenantId).
 */
export function usePartnersAdmin(tenantId?: string | null) {
  return useQuery({
    queryKey: ["partners-admin", tenantId],
    queryFn: async (): Promise<PartnerAdmin[]> => {
      if (!tenantId) return [];
      const ownPromise = supabase
        .from("partners")
        .select("id, tenant_id, name, description, logo_url, active, display_order, is_global")
        .eq("tenant_id", tenantId);

      const assignedPromise = supabase
        .from("partner_tenants")
        .select(
          "partner:partners(id, tenant_id, name, description, logo_url, active, display_order, is_global)",
        )
        .eq("tenant_id", tenantId);

      const [own, assigned] = await Promise.all([ownPromise, assignedPromise]);
      if (own.error) throw own.error;
      if (assigned.error) throw assigned.error;

      const map = new Map<string, PartnerAdmin>();
      ((own.data ?? []) as PartnerAdmin[]).forEach((p) => map.set(p.id, p));
      type AssignedRow = { partner: PartnerAdmin | null };
      ((assigned.data ?? []) as unknown as AssignedRow[]).forEach((row) => {
        if (row.partner && !map.has(row.partner.id)) map.set(row.partner.id, row.partner);
      });
      return Array.from(map.values()).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      );
    },
    enabled: !!tenantId,
  });
}

export function useCreatePartner(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartnerInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("partners")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          description: input.description,
          logo_url: input.logo_url,
          display_order: input.display_order,
          active: true,
          is_global: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-admin"] });
      qc.invalidateQueries({ queryKey: ["admin", "parceiros"] });
      toast.success("Parceiro criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar parceiro: " + err.message),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PartnerInput }) => {
      const { error } = await supabase
        .from("partners")
        .update({
          name: input.name,
          description: input.description,
          logo_url: input.logo_url,
          display_order: input.display_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-admin"] });
      qc.invalidateQueries({ queryKey: ["admin", "parceiros"] });
      toast.success("Parceiro atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar parceiro: " + err.message),
  });
}

export function useTogglePartnerActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("partners").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-admin"] });
      qc.invalidateQueries({ queryKey: ["admin", "parceiros"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-admin"] });
      qc.invalidateQueries({ queryKey: ["admin", "parceiros"] });
      toast.success("Parceiro excluído");
    },
    onError: (err: Error) => toast.error("Erro ao excluir: " + err.message),
  });
}

export function usePartnerActionsAdmin(partnerId?: string | null) {
  return useQuery({
    queryKey: ["partner-actions-admin", partnerId],
    queryFn: async (): Promise<PartnerAdminAction[]> => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("partner_actions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PartnerAdminAction[];
    },
    enabled: !!partnerId,
  });
}

/** Bulk replace das ações de um parceiro. */
export function useSavePartnerActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      partnerId,
      actions,
    }: {
      partnerId: string;
      actions: PartnerActionInput[];
    }) => {
      const del = await supabase.from("partner_actions").delete().eq("partner_id", partnerId);
      if (del.error) throw del.error;
      if (actions.length === 0) return;
      const { error } = await supabase.from("partner_actions").insert(
        actions.map((a) => ({
          partner_id: partnerId,
          label: a.label,
          action_type: a.action_type,
          value: a.value,
          is_primary: a.is_primary,
          display_order: a.display_order,
          whatsapp_message: a.whatsapp_message,
        })),
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["partner-actions-admin", vars.partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-actions"] });
      toast.success("Ações salvas!");
    },
    onError: (err: Error) => toast.error("Erro ao salvar ações: " + err.message),
  });
}
