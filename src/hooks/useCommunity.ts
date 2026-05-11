// Hooks da Comunidade — posts aprovados do tenant + moderação admin.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CommunityPost {
  id: string;
  tenant_id: string;
  student_id: string | null;
  author_id: string | null;
  image_url: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  is_approved: boolean | null;
  created_at: string;
  /** Author info (joined). */
  author_name?: string | null;
  author_role?: string | null;
  author_photo_url?: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  role: string | null;
  photo_url: string | null;
}

interface StudentRow {
  id: string;
  user_id: string | null;
}

interface RawPost {
  id: string;
  tenant_id: string;
  student_id: string | null;
  author_id: string | null;
  image_url: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  is_approved: boolean | null;
  created_at: string;
}

/** Lista posts aprovados de um tenant + nome do autor.
 *  Se expiryDays > 0, filtra apenas posts mais novos que X dias. */
export function useCommunityPosts(tenantId?: string, expiryDays?: number) {
  return useQuery({
    queryKey: ["community-posts", tenantId, expiryDays],
    queryFn: async (): Promise<CommunityPost[]> => {
      if (!tenantId) return [];

      let query = supabase
        .from("community_posts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50);

      // Filtro de expiração
      if (expiryDays && expiryDays > 0) {
        const cutoff = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", cutoff);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      const rawPosts = (posts as RawPost[]) ?? [];
      if (rawPosts.length === 0) return [];

      const authorIds = Array.from(
        new Set(rawPosts.map((p) => p.author_id).filter((x): x is string => !!x)),
      );
      const studentIds = Array.from(
        new Set(rawPosts.map((p) => p.student_id).filter((x): x is string => !!x)),
      );

      // Fetch profiles (when author_id is a user_id)
      let profiles: ProfileRow[] = [];
      if (authorIds.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, role, photo_url")
          .in("id", authorIds);
        profiles = (data as ProfileRow[]) ?? [];
      }

      // Fetch students -> resolve user_id -> profile
      let students: StudentRow[] = [];
      if (studentIds.length) {
        const { data } = await supabase
          .from("students")
          .select("id, user_id")
          .in("id", studentIds);
        students = (data as StudentRow[]) ?? [];
        const extraIds = students
          .map((s) => s.user_id)
          .filter((x): x is string => !!x && !authorIds.includes(x));
        if (extraIds.length) {
          const { data: extraProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, role, photo_url")
            .in("id", extraIds);
          profiles = profiles.concat((extraProfiles as ProfileRow[]) ?? []);
        }
      }

      const profileById = new Map(profiles.map((p) => [p.id, p]));
      const studentById = new Map(students.map((s) => [s.id, s]));

      return rawPosts.map((p) => {
        let profile: ProfileRow | undefined;
        if (p.author_id) profile = profileById.get(p.author_id);
        if (!profile && p.student_id) {
          const s = studentById.get(p.student_id);
          if (s?.user_id) profile = profileById.get(s.user_id);
        }
        return {
          ...p,
          author_name: profile?.full_name ?? null,
          author_role: profile?.role ?? null,
          author_photo_url: profile?.photo_url ?? null,
        } satisfies CommunityPost;
      });
    },
    enabled: !!tenantId,
  });
}

/** Posts pendentes de aprovação (admin). */
export function usePendingPosts(tenantId?: string | null) {
  return useQuery({
    queryKey: ["community-pending", tenantId],
    queryFn: async (): Promise<CommunityPost[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_approved", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (data as RawPost[]) ?? [];
      if (!rows.length) return [];

      const authorIds = Array.from(
        new Set(rows.map((p) => p.author_id).filter((x): x is string => !!x)),
      );
      const studentIds = Array.from(
        new Set(rows.map((p) => p.student_id).filter((x): x is string => !!x)),
      );

      let profiles: ProfileRow[] = [];
      if (authorIds.length) {
        const { data: pdata } = await supabase
          .from("profiles")
          .select("id, full_name, role, photo_url")
          .in("id", authorIds);
        profiles = (pdata as ProfileRow[]) ?? [];
      }
      let students: StudentRow[] = [];
      if (studentIds.length) {
        const { data: sdata } = await supabase
          .from("students")
          .select("id, user_id")
          .in("id", studentIds);
        students = (sdata as StudentRow[]) ?? [];
        const extraIds = students
          .map((s) => s.user_id)
          .filter((x): x is string => !!x && !authorIds.includes(x));
        if (extraIds.length) {
          const { data: extra } = await supabase
            .from("profiles")
            .select("id, full_name, role, photo_url")
            .in("id", extraIds);
          profiles = profiles.concat((extra as ProfileRow[]) ?? []);
        }
      }
      const profileById = new Map(profiles.map((p) => [p.id, p]));
      const studentById = new Map(students.map((s) => [s.id, s]));

      return rows.map((p) => {
        let profile: ProfileRow | undefined;
        if (p.author_id) profile = profileById.get(p.author_id);
        if (!profile && p.student_id) {
          const s = studentById.get(p.student_id);
          if (s?.user_id) profile = profileById.get(s.user_id);
        }
        return {
          ...p,
          author_name: profile?.full_name ?? null,
          author_role: profile?.role ?? null,
          author_photo_url: profile?.photo_url ?? null,
        } satisfies CommunityPost;
      });
    },
    enabled: !!tenantId,
  });
}

export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ is_approved: true })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-pending"] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Publicação aprovada!");
    },
    onError: (err: Error) => toast.error("Erro ao aprovar: " + err.message),
  });
}

export function useRejectPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-pending"] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Publicação removida");
    },
    onError: (err: Error) => toast.error("Erro ao remover: " + err.message),
  });
}

const LAST_VISIT_KEY = "last_community_visit";

/**
 * Conta posts criados desde o último acesso à comunidade.
 * Persiste timestamp em localStorage por tenant.
 */
export function useNewCommunityPosts(tenantId?: string) {
  const { data: posts = [] } = useCommunityPosts(tenantId);

  const storageKey = tenantId ? `${LAST_VISIT_KEY}_${tenantId}` : LAST_VISIT_KEY;

  const lastVisit = (() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Date(raw) : null;
    } catch {
      return null;
    }
  })();

  const count = lastVisit
    ? posts.filter((p) => new Date(p.created_at) > lastVisit).length
    : 0;

  const markAsVisited = () => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // Ignora erro de storage
    }
  };

  return { count, markAsVisited };
}
