// usePlans — CRUD de planos do tenant.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const PLAN_TYPES = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "avulso", label: "Avulso (drop-in)" },
] as const;

export type PlanType = (typeof PLAN_TYPES)[number]["value"];

export interface Plan {
  id: string;
  tenant_id: string;
  name: string;
  type: PlanType;
  price_cents: number;
  signup_fee_cents: number | null;
  billing_cycle_days: number | null;
  classes_per_week: number | null;
  active: boolean;
  display_order: number;
  payment_frequency: string | null;
  visible_on_signup: boolean;
  payment_config: Record<string, unknown> | null;
  rules_json: Record<string, unknown> | null;
}

export interface PlanInput {
  name: string;
  type: PlanType;
  price_cents: number;
  signup_fee_cents: number;
  billing_cycle_days: number;
  classes_per_week: number | null;
  payment_frequency: string;
  visible_on_signup: boolean;
  display_order: number;
}

export function usePlans(tenantId?: string | null) {
  return useQuery({
    queryKey: ["plans", tenantId],
    queryFn: async (): Promise<Plan[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
    enabled: !!tenantId,
  });
}

export function useCreatePlan(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("plans")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          type: input.type,
          price_cents: input.price_cents,
          signup_fee_cents: input.signup_fee_cents,
          billing_cycle_days: input.billing_cycle_days,
          classes_per_week: input.classes_per_week,
          payment_frequency: input.payment_frequency,
          visible_on_signup: input.visible_on_signup,
          display_order: input.display_order,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["admin", "planos"] });
      toast.success("Plano criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar plano: " + err.message),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PlanInput }) => {
      const { error } = await supabase
        .from("plans")
        .update({
          name: input.name,
          type: input.type,
          price_cents: input.price_cents,
          signup_fee_cents: input.signup_fee_cents,
          billing_cycle_days: input.billing_cycle_days,
          classes_per_week: input.classes_per_week,
          payment_frequency: input.payment_frequency,
          visible_on_signup: input.visible_on_signup,
          display_order: input.display_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["admin", "planos"] });
      toast.success("Plano atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar plano: " + err.message),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["admin", "planos"] });
      toast.success("Plano excluído");
    },
    onError: (err: Error) =>
      toast.error("Erro ao excluir plano. Verifique vínculos. " + err.message),
  });
}

export function useTogglePlanActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("plans").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["admin", "planos"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}
