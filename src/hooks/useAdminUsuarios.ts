// useAdminUsuarios — papéis no tenant + dados do profile.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type AdminUserRole =
  | "owner"
  | "manager"
  | "finance"
  | "coach"
  | "staff"
  | "student"
  | "coordinator"
  | "superadmin";

export interface AdminUsuario {
  user_id: string;
  role: AdminUserRole;
  tenant_id: string;
  full_name: string;
  email: string | null;
  photo_url: string | null;
  active: boolean;
  nickname: string | null;
}

export function useAdminUsuarios(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "usuarios", tenantId],
    queryFn: async (): Promise<AdminUsuario[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, tenant_id, profile:profiles!user_roles_user_id_fkey(full_name, email, photo_url, active, nickname)")
        .eq("tenant_id", tenantId);
      if (error) throw error;
      type Row = {
        user_id: string;
        role: AdminUserRole;
        tenant_id: string;
        profile: { full_name: string; email: string | null; photo_url: string | null; active: boolean; nickname: string | null } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        user_id: r.user_id,
        role: r.role,
        tenant_id: r.tenant_id,
        full_name: r.profile?.full_name ?? "—",
        email: r.profile?.email ?? null,
        photo_url: r.profile?.photo_url ?? null,
        active: r.profile?.active ?? true,
        nickname: r.profile?.nickname ?? null,
      }));
    },
    enabled: !!tenantId,
  });
}
