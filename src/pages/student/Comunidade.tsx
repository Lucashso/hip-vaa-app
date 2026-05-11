// Comunidade — feed + criar post + like + comentar.

import { useMemo, useRef, useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts, type CommunityPost } from "@/hooks/useCommunity";
import { usePartners } from "@/hooks/usePartners";
import { useTenant } from "@/hooks/useTenant";
import { useMyStudent } from "@/hooks/useStudent";
import {
  useCreatePost,
  useToggleLike,
  useMyCommunityLikes,
  usePostComments,
  useAddComment,
} from "@/hooks/useCommunityMutations";
import { validateImage } from "@/lib/uploadValidation";
import { getInitial } from "@/lib/utils";
import { toast } from "sonner";

const AUTHOR_COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#7B2D9F", "#7A4A1F", "#25C7E5"];
const PARTNER_COLORS = ["#7B2D9F", "#1B6FB0", "#7A4A1F", "#FF6B4A", "#2FB37A"];

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
    case "owner":
      return "Owner";
    case "manager":
      return "Gestor";
    case "coach":
      return "Instrutor";
    case "staff":
      return "Recepção";
    case "coordinator":
      return "Coordenador";
    case "finance":
      return "Financeiro";
    case "superadmin":
      return "Equipe";
    default:
      return "Atleta";
  }
}

export default function StudentComunidade() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || undefined;
  const { data: tenant } = useTenant();
  const { data: student } = useMyStudent();
  const { data: posts = [], isLoading } = useCommunityPosts(tenantId);
  const { data: partners = [] } = usePartners(tenantId);
  const { data: likedSet } = useMyCommunityLikes(profile?.id);
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();

  const [createOpen, setCreateOpen] = useState(false);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);

  const subtitle = useMemo(() => {
    if (posts.length === 0) return "COMUNIDADE HIP VA'A";
    return `${posts.length} POSTS RECENTES`;
  }, [posts.length]);

  const partnerStrip = partners.slice(0, 8);

  const moderationEnabled = !!(tenant?.settings_json as Record<string, unknown> | null)?.[
    "community_moderation_enabled"
  ];

  const handleLike = (post: CommunityPost) => {
    if (!profile?.id) {
      toast.error("Faça login pra curtir");
      return;
    }
    toggleLike.mutate({
      postId: post.id,
      studentId: student?.id ?? null,
      profileId: profile.id,
    });
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
      {partnerStrip.length > 0 && (
        <div>
          <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-2">
            PARCEIROS DO CLUBE
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            {partnerStrip.map((p, i) => (
              <div
                key={p.id}
                className="shrink-0 px-3.5 py-2.5 rounded-[12px] bg-hv-surface border border-hv-line text-[12px] font-semibold flex gap-2 items-center"
              >
                <div
                  className="w-[22px] h-[22px] rounded-md"
                  style={{ background: PARTNER_COLORS[i % PARTNER_COLORS.length] }}
                />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

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
          {posts.map((p, i) => {
            const name = p.author_name || "Atleta";
            const role = roleLabel(p.author_role);
            const c = AUTHOR_COLORS[i % AUTHOR_COLORS.length];
            const liked = likedSet?.has(p.id) ?? false;
            return (
              <div key={p.id} className="hv-card p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center text-white font-display font-bold"
                    style={{ background: c }}
                  >
                    {getInitial(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{name}</div>
                    <div className="text-[10px] text-hv-text-3 font-mono">
                      {role} · {timeAgo(p.created_at)}
                    </div>
                  </div>
                </div>
                {p.caption && (
                  <p className="text-[13px] leading-[1.55] mt-2.5 text-foreground">
                    {p.caption}
                  </p>
                )}
                {p.image_url && (
                  <div className="mt-2.5 rounded-[12px] overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.caption || name}
                      className="w-full h-auto max-h-[300px] object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-4 mt-3 text-[12px] text-hv-text-2">
                  <button
                    type="button"
                    onClick={() => handleLike(p)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <HVIcon
                      name="star"
                      size={14}
                      color={liked ? "hsl(var(--hv-coral))" : "hsl(var(--hv-text-2))"}
                      stroke={liked ? 2.4 : 1.8}
                    />
                    {p.likes_count ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentPost(p)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <HVIcon name="bell" size={14} />
                    {p.comments_count ?? 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreatePostDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={async (file, caption) => {
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
          }}
          busy={createPost.isPending}
        />
      )}

      {commentPost && (
        <CommentsDialog
          post={commentPost}
          onClose={() => setCommentPost(null)}
          studentId={student?.id ?? null}
          profileId={profile?.id}
        />
      )}
    </PageScaffold>
  );
}

interface CreatePostDialogProps {
  onClose: () => void;
  onSubmit: (file: File, caption: string) => Promise<void>;
  busy: boolean;
}

function CreatePostDialog({ onClose, onSubmit, busy }: CreatePostDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      validateImage(f, { maxSizeMB: 10 });
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Selecione uma foto");
      return;
    }
    await onSubmit(file, caption);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end">
      <div className="bg-background rounded-t-[24px] w-full max-w-md mx-auto max-h-[90vh] flex flex-col">
        <div className="p-5 flex items-center justify-between border-b border-hv-line">
          <div className="font-display text-[18px]">Nova foto</div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
          {preview ? (
            <div className="rounded-[14px] overflow-hidden">
              <img src={preview} alt="preview" className="w-full max-h-[300px] object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={pick}
              className="w-full h-44 rounded-[14px] border-2 border-dashed border-hv-line grid place-items-center bg-hv-foam/40 text-hv-navy"
            >
              <div className="flex flex-col items-center gap-2">
                <HVIcon name="plus" size={28} stroke={2.2} />
                <span className="text-sm font-semibold">Selecionar foto</span>
                <span className="text-[11px] text-hv-text-3">JPG, PNG ou WEBP até 10MB</span>
              </div>
            </button>
          )}
          {preview && (
            <button
              type="button"
              onClick={pick}
              className="text-[12px] font-semibold text-hv-blue underline"
            >
              Trocar foto
            </button>
          )}
          <div>
            <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
              Legenda
            </label>
            <textarea
              className="mt-1.5 w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy min-h-[80px]"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Conta como foi o treino…"
              maxLength={500}
            />
          </div>
        </div>
        <div className="p-5 border-t border-hv-line">
          <button
            type="button"
            disabled={busy}
            onClick={handleSubmit}
            className="w-full h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {busy ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CommentsDialogProps {
  post: CommunityPost;
  onClose: () => void;
  studentId: string | null;
  profileId: string | undefined;
}

function CommentsDialog({ post, onClose, studentId, profileId }: CommentsDialogProps) {
  const { data: comments = [], isLoading } = usePostComments(post.id);
  const addComment = useAddComment();
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!profileId) {
      toast.error("Faça login pra comentar");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: trimmed,
        studentId,
        profileId,
      });
      setText("");
    } catch {
      // toast já no hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end">
      <div className="bg-background rounded-t-[24px] w-full max-w-md mx-auto h-[80vh] flex flex-col">
        <div className="p-5 flex items-center justify-between border-b border-hv-line">
          <div className="font-display text-[18px]">Comentários</div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-hv-text-2">Carregando…</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-hv-text-3 mt-6">
              Seja a primeira pessoa a comentar.
            </div>
          ) : (
            comments.map((c, i) => {
              const name = c.author_name || "Atleta";
              const color = AUTHOR_COLORS[i % AUTHOR_COLORS.length];
              return (
                <div key={c.id} className="flex gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                    style={{ background: color }}
                  >
                    {getInitial(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold">{name}</div>
                    <p className="text-[13px] text-foreground mt-0.5 leading-[1.45]">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-hv-line">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva um comentário…"
              maxLength={500}
            />
            <button
              type="button"
              disabled={addComment.isPending || !text.trim()}
              onClick={handleSend}
              className="px-4 rounded-[12px] bg-hv-navy text-white font-semibold text-sm disabled:opacity-40"
            >
              {addComment.isPending ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
