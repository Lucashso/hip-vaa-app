// FeedPost — card de post: avatar + autor + role chip + tempo relativo
//            + imagem clicável (zoom) + caption + likes + comments + menu (... → reportar/excluir).

import { useState } from "react";
import { getInitial } from "@/lib/utils";
import { HVIcon } from "@/lib/HVIcon";
import { LikeButton } from "./LikeButton";
import { CommentsSheet } from "./CommentsSheet";
import { ConfirmDialog } from "@/components/Modal";
import type { CommunityPost } from "@/hooks/useCommunity";
import { useDeletePost, useReportPost } from "@/hooks/useCommunityMutations";
import { toast } from "sonner";

const AUTHOR_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#7B2D9F", "#7A4A1F", "#25C7E5"];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${Math.max(1, min)}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "owner": return "Owner";
    case "manager": return "Gestor";
    case "coach": return "Instrutor";
    case "staff": return "Recepção";
    case "coordinator": return "Coordenador";
    case "finance": return "Financeiro";
    case "superadmin": return "Equipe";
    default: return "Atleta";
  }
}

interface FeedPostProps {
  post: CommunityPost;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
  isAuthor: boolean;
  studentId: string | null;
  profileId: string | undefined;
  onImageClick?: (url: string) => void;
}

export function FeedPost({
  post,
  index,
  liked,
  onToggleLike,
  isAuthor,
  studentId,
  profileId,
  onImageClick,
}: FeedPostProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deletePost = useDeletePost();
  const reportPost = useReportPost();

  const name = post.author_name || "Atleta";
  const role = roleLabel(post.author_role);
  const color = AUTHOR_COLORS[index % AUTHOR_COLORS.length];

  const handleDelete = () => {
    deletePost.mutate(post.id);
    setConfirmDelete(false);
  };

  const handleReport = () => {
    if (!profileId) {
      toast.error("Faça login para reportar");
      return;
    }
    reportPost.mutate({ postId: post.id, reporterId: profileId });
    setMenuOpen(false);
  };

  return (
    <>
      <div className="hv-card p-3.5">
        {/* Header: avatar + autor + menu */}
        <div className="flex items-center gap-2.5">
          {post.author_photo_url ? (
            <img
              src={post.author_photo_url}
              alt={name}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full grid place-items-center text-white font-display font-bold text-[13px] shrink-0"
              style={{ background: color }}
            >
              {getInitial(name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold truncate">{name}</span>
              <span
                className="hv-chip text-[10px] px-1.5 py-0.5"
                style={{
                  background:
                    role === "Atleta"
                      ? "hsl(var(--hv-foam))"
                      : "hsl(var(--hv-navy) / 0.12)",
                  color:
                    role === "Atleta"
                      ? "hsl(var(--hv-text-2))"
                      : "hsl(var(--hv-navy))",
                }}
              >
                {role}
              </span>
            </div>
            <div className="hv-mono text-[10px] text-hv-text-3 mt-0.5">
              {timeAgo(post.created_at)}
            </div>
          </div>

          {/* Menu (...) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-[8px] grid place-items-center text-hv-text-2 hover:bg-hv-foam transition-colors"
              aria-label="Opções"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 bg-hv-surface border border-hv-line rounded-[12px] shadow-lg z-20 min-w-[160px] overflow-hidden"
                onBlur={() => setMenuOpen(false)}
              >
                {!isAuthor && (
                  <button
                    type="button"
                    onClick={handleReport}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-hv-text-2 hover:bg-hv-foam flex items-center gap-2"
                  >
                    <HVIcon name="bell" size={14} />
                    Reportar
                  </button>
                )}
                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-[hsl(var(--hv-coral))] hover:bg-hv-foam flex items-center gap-2"
                  >
                    <HVIcon name="x" size={14} color="hsl(var(--hv-coral))" />
                    Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-[13px] leading-[1.55] mt-2.5 text-foreground">{post.caption}</p>
        )}

        {/* Imagem clicável */}
        {post.image_url && (
          <div
            className="mt-2.5 rounded-[12px] overflow-hidden cursor-pointer"
            onClick={() => onImageClick?.(post.image_url!)}
          >
            <img
              src={post.image_url}
              alt={post.caption || name}
              className="w-full h-auto max-h-[300px] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions: like + comments */}
        <div className="flex gap-4 mt-3 text-[12px] text-hv-text-2">
          <LikeButton
            liked={liked}
            count={post.likes_count ?? 0}
            onToggle={onToggleLike}
          />
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <HVIcon name="bell" size={14} />
            {post.comments_count ?? 0}
          </button>
        </div>
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        postId={post.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        studentId={studentId}
        profileId={profileId}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir publicação?"
        message="Esta ação não pode ser desfeita. A publicação será removida permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deletePost.isPending}
      />

      {/* Backdrop para fechar menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
