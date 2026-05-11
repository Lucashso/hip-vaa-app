// useVenues — CRUD de locais (venues) do tenant.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Venue {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  radius_m: number | null;
  default_capacity: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface VenueInput {
  name: string;
  address: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  radius_m: number | null;
  default_capacity: number | null;
  notes: string | null;
}

export function useVenues(tenantId?: string | null) {
  return useQuery({
    queryKey: ["venues", tenantId],
    queryFn: async (): Promise<Venue[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("venues")
        .select("id, tenant_id, name, address, geo_lat, geo_lng, radius_m, default_capacity, notes, active, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Venue[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateVenue(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VenueInput) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("venues")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          address: input.address,
          geo_lat: input.geo_lat,
          geo_lng: input.geo_lng,
          radius_m: input.radius_m ?? 100,
          default_capacity: input.default_capacity,
          notes: input.notes,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["admin", "locais"] });
      toast.success("Local criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar local: " + err.message),
  });
}

export function useUpdateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: VenueInput }) => {
      const { error } = await supabase
        .from("venues")
        .update({
          name: input.name,
          address: input.address,
          geo_lat: input.geo_lat,
          geo_lng: input.geo_lng,
          radius_m: input.radius_m ?? 100,
          default_capacity: input.default_capacity,
          notes: input.notes,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["admin", "locais"] });
      toast.success("Local atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar local: " + err.message),
  });
}

export function useDeleteVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("venues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["admin", "locais"] });
      toast.success("Local excluído");
    },
    onError: (err: Error) =>
      toast.error("Erro ao excluir. Verifique se não há vínculos. " + err.message),
  });
}

export function useToggleVenueActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("venues").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["admin", "locais"] });
    },
    onError: (err: Error) => toast.error("Erro ao alterar status: " + err.message),
  });
}
