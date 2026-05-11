// useStrava — hooks para integração Strava (conexão/desconexão).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface StravaConnection {
  id: string;
  user_id: string;
  athlete_id: string | null;
  athlete_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  connected_at: string;
  active: boolean;
}

export function useStravaConnection(userId?: string) {
  return useQuery({
    queryKey: ["strava-connection", userId],
    queryFn: async (): Promise<StravaConnection | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("strava_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return (data as StravaConnection) ?? null;
    },
    enabled: !!userId,
  });
}

export function useStravaConnect() {
  return useMutation({
    mutationFn: async () => {
      // Obter URL de auth da edge function
      const { data, error } = await supabase.functions.invoke("strava-auth", {
        body: { action: "get_auth_url" },
      });
      if (error) throw error;
      const url = (data as { auth_url?: string })?.auth_url;
      if (!url) throw new Error("URL de autenticação não retornada");
      window.open(url, "_blank", "width=600,height=700");
    },
    onError: (err: Error) => toast.error("Erro ao conectar Strava: " + err.message),
  });
}

export function useStravaDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Tentar via edge function primeiro
      try {
        const res = await supabase.functions.invoke("strava-disconnect", {
          body: { user_id: userId },
        });
        if (res.error) throw res.error;
      } catch {
        // Fallback: marcar conexão como inativa no banco
        const { error } = await supabase
          .from("strava_connections")
          .update({ active: false })
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ["strava-connection", userId] });
      toast.success("Strava desconectado");
    },
    onError: (err: Error) => toast.error("Erro ao desconectar: " + err.message),
  });
}
