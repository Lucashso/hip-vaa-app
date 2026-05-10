// Hooks de indicações (referrals + credits + rewards/redemptions).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ReferralRow {
  id: string;
  referred_email: string | null;
  referred_student_id: string | null;
  status: "pending" | "matriculated" | "cancelled";
  reward_cents: number;
  matriculated_at: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  cost_cents: number;
  photo_url: string | null;
  stock: number | null;
  active: boolean;
  display_order: number;
}

/** Garante referral_code. */
export function useReferralCode(studentId?: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["referral-code", studentId],
    queryFn: async (): Promise<string | null> => {
      if (!studentId) return null;
      const { data: row } = await supabase
        .from("students")
        .select("referral_code")
        .eq("id", studentId)
        .single();
      if (row?.referral_code) return row.referral_code as string;
      const { data: code } = await supabase.rpc("ensure_referral_code", { _student_id: studentId });
      queryClient.invalidateQueries({ queryKey: ["my-referrals"] });
      return code as string;
    },
    enabled: !!studentId,
  });
}

/** Indicações feitas pelo aluno. */
export function useMyReferrals(studentId?: string) {
  return useQuery({
    queryKey: ["my-referrals", studentId],
    queryFn: async (): Promise<ReferralRow[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("id, referred_email, referred_student_id, status, reward_cents, matriculated_at, created_at")
        .eq("referrer_student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ReferralRow[]) ?? [];
    },
    enabled: !!studentId,
  });
}

/** Catálogo de recompensas ativas. */
export function useActiveRewards() {
  return useQuery({
    queryKey: ["active-rewards"],
    queryFn: async (): Promise<Reward[]> => {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as Reward[]) ?? [];
    },
  });
}

/** Resgates do aluno. */
export function useMyRedemptions() {
  return useQuery({
    queryKey: ["my-redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_redemptions")
        .select("*, reward:referral_rewards(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Resgata reward via RPC. */
export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.rpc("redeem_referral_reward", {
        _reward_id: rewardId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as {
        redemption_id: string;
        consumed_cents: number;
        remaining_credits_cents: number;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["my-credits"] });
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] });
      toast.success("Resgate concluído!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
