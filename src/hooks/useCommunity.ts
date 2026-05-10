// Hooks da Comunidade — posts aprovados do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

/** Lista posts aprovados de um tenant + nome do autor. */
export function useCommunityPosts(tenantId?: string) {
  return useQuery({
    queryKey: ["community-posts", tenantId],
    queryFn: async (): Promise<CommunityPost[]> => {
      if (!tenantId) return [];

      const { data: posts, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50);
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
