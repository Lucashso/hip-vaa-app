// useBoats — CRUD de embarcações do tenant.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const BOAT_TYPES = [
  { value: "V1", label: "V1 — Va'a Individual", capacity: 1 },
  { value: "OC1", label: "OC1 — Outrigger 1", capacity: 1 },
  { value: "OC2", label: "OC2 — Outrigger 2", capacity: 2 },
  { value: "V3", label: "V3 — Va'a 3 lugares", capacity: 3 },
  { value: "OC4", label: "OC4 — Outrigger 4", capacity: 4 },
  { value: "V6", label: "V6 — Va'a 6 lugares", capacity: 6 },
  { value: "OC6", label: "OC6 — Outrigger 6", capacity: 6 },
] as const;

export type BoatType = (typeof BOAT_TYPES)[number]["value"];
export type BoatStatus = "active" | "maintenance";

export interface Boat {
  id: string;
  tenant_id: string;
  name: string;
  type: BoatType;
  capacity: number;
  status: BoatStatus;
  photo_url: string | null;
  venue_id: string | null;
  created_at: string;
  venue?: { id: string; name: string } | null;
}

export interface BoatInput {
  name: string;
  type: BoatType;
  capacity: number;
  venue_id: string | null;
  photo_url: string | null;
  notes?: string | null;
}

export function useBoats(tenantId?: string | null) {
  return useQuery({
    queryKey: ["boats", tenantId],
    queryFn: async (): Promise<Boat[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("boats")
        .select("id, tenant_id, name, type, capacity, status, photo_url, venue_id, created_at, venue:venues(id, name)")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Boat[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateBoat(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BoatInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("boats")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          type: input.type,
          capacity: input.capacity,
          status: "active" as BoatStatus,
          photo_url: input.photo_url || null,
          venue_id: input.venue_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boats"] });
      qc.invalidateQueries({ queryKey: ["admin", "canoas"] });
      toast.success("Embarcação criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar embarcação: " + err.message),
  });
}

export function useUpdateBoat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BoatInput }) => {
      const { error } = await supabase
        .from("boats")
        .update({
          name: input.name,
          type: input.type,
          capacity: input.capacity,
          photo_url: input.photo_url || null,
          venue_id: input.venue_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boats"] });
      qc.invalidateQueries({ queryKey: ["admin", "canoas"] });
      toast.success("Embarcação atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar embarcação: " + err.message),
  });
}

export function useDeleteBoat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boats").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boats"] });
      qc.invalidateQueries({ queryKey: ["admin", "canoas"] });
      toast.success("Embarcação excluída");
    },
    onError: (err: Error) =>
      toast.error("Erro ao excluir embarcação: " + err.message),
  });
}

export function useToggleBoatStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BoatStatus }) => {
      const { error } = await supabase.from("boats").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["boats"] });
      qc.invalidateQueries({ queryKey: ["admin", "canoas"] });
      toast.success(vars.status === "active" ? "Ativada" : "Em manutenção");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}
