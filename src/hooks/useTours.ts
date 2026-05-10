// Hooks de Passeios (tours / tour_dates / tour_bookings).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Tour {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_url: string | null;
  distance_km: number | null;
  level: string | null;
  default_price_cents: number;
  default_total_slots: number;
  active: boolean;
}

export interface TourDate {
  id: string;
  tour_id: string;
  tenant_id: string;
  date: string;
  start_time: string | null;
  total_slots: number;
  filled_slots: number;
  price_cents: number;
  active: boolean;
}

/** Próximas datas de tours ativos do tenant. */
export function useUpcomingTourDates(tenantId?: string) {
  return useQuery({
    queryKey: ["upcoming-tour-dates", tenantId],
    queryFn: async (): Promise<(TourDate & { tour: Tour | null })[]> => {
      let q = supabase
        .from("tour_dates")
        .select("*, tour:tours(*)")
        .eq("active", true)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as never) ?? [];
    },
  });
}

/** Cria booking via edge function. */
export function useCreateTourBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tour_date_id: string;
      buyer_name?: string;
      buyer_email?: string;
      buyer_phone?: string;
      buyer_cpf?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-tour-booking", {
        body: input,
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as {
        booking_id: string;
        amount_cents: number;
        pix_qr: string | null;
        pix_qr_base64: string | null;
        expires_at: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-tour-dates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
