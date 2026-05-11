// usePendingTenantSignups — gerencia pré-cadastros de novas filiais (pending_tenant_signups).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface PendingTenantSignup {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  city: string | null;
  state: string | null;
  plan_id: string | null;
  signup_link_id: string | null;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export type PendingSignupFilter = "all" | "pending" | "approved" | "rejected";

const QK = (filter?: PendingSignupFilter) => ["pending-tenant-signups", filter ?? "all"];

export function usePendingTenantSignups(filter: PendingSignupFilter = "all") {
  return useQuery({
    queryKey: QK(filter),
    queryFn: async (): Promise<PendingTenantSignup[]> => {
      let q = supabase
        .from("pending_tenant_signups")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data as PendingTenantSignup[]) ?? [];
    },
  });
}

export function useApprovePendingSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Try calling edge function first; fall back to direct status update
      try {
        const res = await supabase.functions.invoke("process-tenant-payment", {
          body: { pending_signup_id: id, action: "approve" },
        });
        if (res.error) throw res.error;
        return res.data;
      } catch {
        // Fallback: just mark as approved
        const { error } = await supabase
          .from("pending_tenant_signups")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-tenant-signups"] });
      qc.invalidateQueries({ queryKey: ["super", "tenants"] });
      toast.success("Pré-cadastro aprovado!");
    },
    onError: (err: Error) => toast.error("Erro ao aprovar: " + err.message),
  });
}

export function useRejectPendingSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pending_tenant_signups")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-tenant-signups"] });
      toast.success("Pré-cadastro rejeitado");
    },
    onError: (err: Error) => toast.error("Erro ao rejeitar: " + err.message),
  });
}
