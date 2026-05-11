// Comunidade — feed refatorado com componentes Community/.

import { useEffect, useMemo, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts, useNewCommunityPosts } from "@/hooks/useCommunity";
import { usePartners } from "@/hooks/usePartners";
import { useTenant } from "@/hooks/useTenant";
import { useMyStudent } from "@/hooks/useStudent";
import {
  useCreatePost,
  useToggleLike,
  useMyCommunityLikes,
} from "@/hooks/useCommunityMutations";
import { FeedPost } from "@/components/Community/FeedPost";
import { PostDialog } from "@/components/Community/PostDialog";
import { PartnerStrip } from "@/components/Community/PartnerStrip";
import { toast } from "sonner";

export default function StudentComunidade() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || undefined;
  const { settings } = useTenant();
  const { data: student } = useMyStudent();
  const { data: partners = [] } = usePartners(tenantId);
  const { data: likedSet } = useMyCommunityLikes(profile?.id);
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();

  const [createOpen, setCreateOpen] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const expiryDays = settings.community_post_expiry_days;
  const moderationEnabled = settings.community_moderation_enabled;

  const { data: posts = [], isLoading } = useCommunityPosts(tenantId, expiryDays);
  const { markAsVisited } = useNewCommunityPosts(tenantId);

  // Marca visita ao entrar na tela
  useEffect(() => {
    markAsVisited();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = useMemo(() => {
    if (posts.length === 0) return "COMUNIDADE HIP VA'A";
    return `${posts.length} POSTS RECENTES`;
  }, [posts.length]);

  const handleLike = (postId: string) => {
    if (!profile?.id) {
      toast.error("Faça login pra curtir");
      return;
    }
    toggleLike.mutate({
      postId,
      studentId: student?.id ?? null,
      profileId: profile.id,
    });
  };

  const handleCreate = async (file: File, caption: string) => {
    if (!tenantId || !profile?.id) {
      toast.error("Sessão inválida");
      return;
    }
    await createPost.mutateAsync({
      tenantId,
      studentId: student?.id ?? null,
      authorId: profile.id,
      imageFile: file,
      caption,
      moderationEnabled,
    });
    setCreateOpen(false);
  };

  return (
    <PageScaffold
      eyebrow={subtitle}
      title="Comunidade"
      trailing={
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-9 h-9 rounded-[12px] bg-hv-navy text-white border-none grid place-items-center active:scale-[0.96] transition-transform"
          aria-label="Nova foto"
        >
          <HVIcon name="plus" size={18} stroke={2.4} />
        </button>
      }
    >
      {/* Partners strip */}
      <PartnerStrip partners={partners} tenantId={tenantId} />

      {/* Feed */}
      {isLoading ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Carregando comunidade…
        </div>
      ) : posts.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="users" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">Tudo calmo por aqui</div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[260px] mx-auto">
            Ainda não há posts aprovados na comunidade do seu clube.
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map((post, i) => (
            <FeedPost
              key={post.id}
              post={post}
              index={i}
              liked={likedSet?.has(post.id) ?? false}
              onToggleLike={() => handleLike(post.id)}
              isAuthor={post.author_id === profile?.id}
              studentId={student?.id ?? null}
              profileId={profile?.id}
              onImageClick={setZoomUrl}
            />
          ))}
        </div>
      )}

      {/* Post dialog */}
      <PostDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        busy={createPost.isPending}
      />

      {/* Fullscreen image viewer */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setZoomUrl(null)}
        >
          <button
            type="button"
            onClick={() => setZoomUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 grid place-items-center text-white"
          >
            <HVIcon name="x" size={20} color="white" />
          </button>
          <img
            src={zoomUrl}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </PageScaffold>
  );
}
