// useCommunityMutations — criar post, like (toggle), comentar.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { validateImage, sanitizeFileName } from "@/lib/uploadValidation";

export interface CommunityComment {
  id: string;
  post_id: string;
  student_id: string | null;
  profile_id: string | null;
  content: string;
  created_at: string | null;
  author_name?: string | null;
  author_photo_url?: string | null;
}

interface CreatePostInput {
  tenantId: string;
  studentId: string | null;
  authorId: string;
  imageFile: File;
  caption: string;
  /** Se moderação tá ON, post entra como is_approved=false. */
  moderationEnabled: boolean;
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      validateImage(input.imageFile, { maxSizeMB: 10 });

      const ext = (input.imageFile.name.split(".").pop() || "jpg").toLowerCase();
      const cleanName = sanitizeFileName(`${Date.now()}.${ext}`);
      const studentSegment = input.studentId ?? input.authorId;
      const path = `${input.tenantId}/${studentSegment}/${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from("community-posts")
        .upload(path, input.imageFile, {
          contentType: input.imageFile.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("community-posts").getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      const { error: insErr } = await supabase
        .from("community_posts")
        .insert({
          tenant_id: input.tenantId,
          student_id: input.studentId,
          author_id: input.authorId,
          image_url: imageUrl,
          caption: input.caption.trim() || null,
          is_approved: !input.moderationEnabled,
        });
      if (insErr) throw insErr;
    },
    onSuccess: (_data, vars) => {
      const msg = vars.moderationEnabled
        ? "Post enviado pra aprovação"
        : "Post publicado!";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      qc.invalidateQueries({ queryKey: ["my-community-likes"] });
    },
    onError: (err: Error) => {
      console.error("createPost", err);
      toast.error(err.message || "Erro ao publicar");
    },
  });
}

/** Toggle like. Verifica existência por (post_id, student_id ou profile_id). */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      studentId,
      profileId,
    }: {
      postId: string;
      studentId: string | null;
      profileId: string;
    }) => {
      // Tenta achar like existente por student_id primeiro; fallback profile_id.
      let existing: { id: string } | null = null;
      if (studentId) {
        const { data } = await supabase
          .from("community_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("student_id", studentId)
          .maybeSingle();
        existing = (data as { id: string } | null) ?? null;
      }
      if (!existing) {
        const { data } = await supabase
          .from("community_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("profile_id", profileId)
          .maybeSingle();
        existing = (data as { id: string } | null) ?? null;
      }

      if (existing) {
        const { error } = await supabase.from("community_likes").delete().eq("id", existing.id);
        if (error) throw error;
        return { liked: false };
      }
      const { error } = await supabase.from("community_likes").insert({
        post_id: postId,
        student_id: studentId,
        profile_id: profileId,
      });
      if (error) throw error;
      return { liked: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      qc.invalidateQueries({ queryKey: ["my-community-likes"] });
    },
    onError: (err: Error) => {
      console.error("toggleLike", err);
      toast.error(err.message || "Erro ao curtir");
    },
  });
}

export function useMyCommunityLikes(profileId?: string) {
  return useQuery({
    queryKey: ["my-community-likes", profileId],
    queryFn: async (): Promise<Set<string>> => {
      if (!profileId) return new Set();
      const { data, error } = await supabase
        .from("community_likes")
        .select("post_id")
        .eq("profile_id", profileId);
      if (error) throw error;
      return new Set(((data as { post_id: string }[]) ?? []).map((r) => r.post_id));
    },
    enabled: !!profileId,
  });
}

export function usePostComments(postId?: string) {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async (): Promise<CommunityComment[]> => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("community_comments")
        .select("id, post_id, student_id, profile_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data as CommunityComment[]) ?? [];

      const profileIds = Array.from(
        new Set(rows.map((r) => r.profile_id).filter((x): x is string => !!x)),
      );
      let profilesMap = new Map<string, { full_name: string | null; photo_url: string | null }>();
      if (profileIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url")
          .in("id", profileIds);
        profilesMap = new Map(
          ((profs as { id: string; full_name: string | null; photo_url: string | null }[]) ?? []).map(
            (p) => [p.id, { full_name: p.full_name, photo_url: p.photo_url }],
          ),
        );
      }
      return rows.map((r) => {
        const prof = r.profile_id ? profilesMap.get(r.profile_id) : undefined;
        return {
          ...r,
          author_name: prof?.full_name ?? null,
          author_photo_url: prof?.photo_url ?? null,
        };
      });
    },
    enabled: !!postId,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
      studentId,
      profileId,
    }: {
      postId: string;
      content: string;
      studentId: string | null;
      profileId: string;
    }) => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error("Comentário vazio");
      const { error } = await supabase.from("community_comments").insert({
        post_id: postId,
        content: trimmed,
        student_id: studentId,
        profile_id: profileId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success("Comentário enviado");
      qc.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: (err: Error) => {
      console.error("addComment", err);
      toast.error(err.message || "Erro ao comentar");
    },
  });
}
