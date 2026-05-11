// useTeam — hooks pra gerenciar membros da equipe (admin/Usuarios).
// Backend: user_roles + profiles + edges create-team-member / admin-delete-user.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/hooks/useAuth";

export type TeamRole = Exclude<Role, "student" | "superadmin"> | "owner";

export const TEAM_ROLES: TeamRole[] = [
  "owner",
  "manager",
  "coordinator",
  "finance",
  "coach",
  "staff",
];

export interface TeamMember {
  user_id: string;
  role: TeamRole;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  active: boolean;
  nickname: string | null;
}

export function useTeamMembers(tenantId?: string | null, roleFilter?: TeamRole | null) {
  return useQuery({
    queryKey: ["team-members", tenantId, roleFilter ?? null],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!tenantId) return [];
      let q = supabase
        .from("user_roles")
        .select(
          "user_id, role, tenant_id, profile:profiles!user_roles_user_id_fkey(full_name, email, phone, photo_url, active, nickname)",
        )
        .eq("tenant_id", tenantId)
        .in("role", TEAM_ROLES as unknown as string[]);

      if (roleFilter) q = q.eq("role", roleFilter as unknown as string);

      const { data, error } = await q;
      if (error) throw error;

      type Row = {
        user_id: string;
        role: TeamRole;
        tenant_id: string;
        profile: {
          full_name: string;
          email: string | null;
          phone: string | null;
          photo_url: string | null;
          active: boolean | null;
          nickname: string | null;
        } | null;
      };

      return ((data ?? []) as unknown as Row[]).map((r) => ({
        user_id: r.user_id,
        role: r.role,
        tenant_id: r.tenant_id,
        full_name: r.profile?.full_name ?? "—",
        email: r.profile?.email ?? null,
        phone: r.profile?.phone ?? null,
        photo_url: r.profile?.photo_url ?? null,
        active: r.profile?.active ?? true,
        nickname: r.profile?.nickname ?? null,
      }));
    },
    enabled: !!tenantId,
  });
}

export interface TeamStats {
  total: number;
  by_role: Record<TeamRole, number>;
}

export function useTeamStats(tenantId?: string | null) {
  return useQuery({
    queryKey: ["team-stats", tenantId],
    queryFn: async (): Promise<TeamStats> => {
      const base: TeamStats = {
        total: 0,
        by_role: {
          owner: 0,
          manager: 0,
          coordinator: 0,
          finance: 0,
          coach: 0,
          staff: 0,
        },
      };
      if (!tenantId) return base;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("tenant_id", tenantId)
        .in("role", TEAM_ROLES as unknown as string[]);
      if (error) throw error;
      (data ?? []).forEach((r) => {
        const k = r.role as TeamRole;
        if (k in base.by_role) {
          base.by_role[k] += 1;
          base.total += 1;
        }
      });
      return base;
    },
    enabled: !!tenantId,
  });
}

export interface CreateTeamMemberInput {
  tenant_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: TeamRole;
  password: string;
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeamMemberInput) => {
      const response = await supabase.functions.invoke("create-team-member", {
        body: input,
      });
      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }
      const data = response.data as { error?: string };
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      toast.success("Usuário cadastrado");
    },
    onError: (err: Error) => {
      console.error("createTeamMember error:", err);
      if (err.message?.includes("already registered")) {
        toast.error("E-mail já cadastrado");
      } else {
        toast.error(err.message || "Erro ao cadastrar usuário");
      }
    },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ active })
        .eq("id", userId);
      if (error) throw error;
      return { userId, active };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      toast.success(vars.active ? "Usuário reativado" : "Usuário desativado");
    },
    onError: (err: Error) => {
      console.error("toggleUserActive error:", err);
      toast.error("Erro ao alterar status");
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      tenantId,
      newRole,
    }: {
      userId: string;
      tenantId: string;
      newRole: TeamRole;
    }) => {
      // Update user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: newRole as unknown as string })
        .eq("user_id", userId)
        .eq("tenant_id", tenantId);
      if (roleError) throw roleError;

      // Also update profiles.role pra manter consistente
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: newRole as unknown as string })
        .eq("id", userId);
      if (profileError) throw profileError;

      return { userId, newRole };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      toast.success("Papel atualizado");
    },
    onError: (err: Error) => {
      console.error("updateUserRole error:", err);
      toast.error("Erro ao atualizar papel");
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userId },
      });
      if (response.error) {
        throw new Error(response.error.message || "Erro ao excluir usuário");
      }
      const data = response.data as { error?: string };
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      toast.success("Usuário excluído");
    },
    onError: (err: Error) => {
      console.error("deleteUser error:", err);
      toast.error(err.message || "Erro ao excluir usuário");
    },
  });
}
