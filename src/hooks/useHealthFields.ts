// useHealthFields — perguntas do questionário de saúde do tenant + CRUD.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const FIELD_TYPES = [
  { value: "boolean", label: "Sim / Não" },
  { value: "text", label: "Texto livre" },
  { value: "number", label: "Número" },
  { value: "select", label: "Múltipla escolha" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];

export interface HealthField {
  id: string;
  tenant_id: string;
  label: string;
  section: string;
  icon_name: string | null;
  has_details: boolean;
  details_placeholder: string | null;
  is_critical: boolean;
  sort_order: number | null;
  field_type: FieldType | null;
  select_options: string[] | null;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
}

export interface HealthFieldInput {
  label: string;
  section: string;
  icon_name: string | null;
  field_type: FieldType;
  select_options: string[] | null;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  is_critical: boolean;
  has_details: boolean;
  sort_order: number;
}

export function useHealthFields(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "health-fields", tenantId],
    queryFn: async (): Promise<HealthField[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("health_questionnaire_fields")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as HealthField[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateHealthField(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HealthFieldInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { error } = await supabase.from("health_questionnaire_fields").insert({
        tenant_id: tenantId,
        label: input.label,
        section: input.section,
        icon_name: input.icon_name || "Activity",
        field_type: input.field_type,
        select_options: input.select_options,
        unit: input.unit,
        min_value: input.min_value,
        max_value: input.max_value,
        is_critical: input.is_critical,
        has_details: input.has_details,
        sort_order: input.sort_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "health-fields"] });
      toast.success("Pergunta criada!");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useUpdateHealthField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: HealthFieldInput }) => {
      const { error } = await supabase
        .from("health_questionnaire_fields")
        .update({
          label: input.label,
          section: input.section,
          icon_name: input.icon_name || "Activity",
          field_type: input.field_type,
          select_options: input.select_options,
          unit: input.unit,
          min_value: input.min_value,
          max_value: input.max_value,
          is_critical: input.is_critical,
          has_details: input.has_details,
          sort_order: input.sort_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "health-fields"] });
      toast.success("Pergunta atualizada!");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useDeleteHealthField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("health_questionnaire_fields")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "health-fields"] });
      toast.success("Pergunta excluída");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useReorderHealthFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { id: string; sort_order: number }[]) => {
      for (const r of rows) {
        const { error } = await supabase
          .from("health_questionnaire_fields")
          .update({ sort_order: r.sort_order })
          .eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "health-fields"] });
    },
    onError: (err: Error) => toast.error("Erro ao reordenar: " + err.message),
  });
}
