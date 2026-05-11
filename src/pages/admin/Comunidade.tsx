// Admin · Comunidade — moderação de posts pendentes + listagem aprovados.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import {
  useCommunityPosts,
  usePendingPosts,
  useApprovePost,
  useRejectPost,
  type CommunityPost,
} from "@/hooks/useCommunity";
import { useTenant, useUpdateTenantSettings } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

type Tab = "pendentes" | "aprovados";
const AVATAR_COLORS = ["#FF6B4A", "#F2B544", "#7B2D9F", "#1B6FB0", "#2FB37A", "#25C7E5"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function PostCard({
  post,
  index,
  actions,
}: {
  post: CommunityPost;
  index: number;
  actions?: React.ReactNode;
}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const name = post.author_name || "Aluno";
  return (
    <div className="hv-card mb-2" style={{ padding: 12 }}>
      <div className="flex gap-2.5 items-center">
        {post.author_photo_url ? (
          <img
            src={post.author_photo_url}
            alt=""
            className="w-8 h-8 rounded-[16px] object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-[16px] grid place-items-center text-white font-bold"
            style={{ background: color, fontFamily: "var(--hv-font-display)" }}
          >
            {(name[0] || "?").toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold truncate">{name}</div>
          <div className="hv-mono text-[10px] text-hv-text-3">{timeAgo(post.created_at)}</div>
        </div>
      </div>
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-full h-48 object-cover rounded-[10px] mt-2"
        />
      )}
      {post.caption && (
        <p className="text-[12px] text-hv-text-2 mt-2" style={{ lineHeight: 1.5 }}>
          {post.caption}
        </p>
      )}
      {actions && <div className="flex gap-1.5 mt-2">{actions}</div>}
    </div>
  );
}

export default function AdminComunidade() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: tenant } = useTenant();
  const { data: pending = [], isLoading: pLoading } = usePendingPosts(tenantId);
  const { data: approved = [], isLoading: aLoading } = useCommunityPosts(tenantId ?? undefined);
  const approve = useApprovePost();
  const reject = useRejectPost();
  const updateSettings = useUpdateTenantSettings();
  const [tab, setTab] = useState<Tab>("pendentes");

  const moderation =
    ((tenant?.settings_json as Record<string, unknown> | null)?.community_moderation_enabled as
      | boolean
      | undefined) ?? true;

  const toggleModeration = () => {
    updateSettings.mutate(
      { community_moderation_enabled: !moderation },
      {
        onSuccess: () =>
          // Use plain alert-free path; tenant query is invalidated by mutation
          undefined,
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Comunidade" sub="MODERAÇÃO · POSTS" />
      <div className="px-4 pt-3">
        <div className="hv-card flex justify-between items-center" style={{ padding: 14 }}>
          <div className="min-w-0">
            <div className="text-[13px] font-bold">Aprovar antes de publicar</div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              {moderation
                ? "Posts ficam pendentes até aprovação"
                : "Posts são publicados automaticamente"}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleModeration}
            disabled={updateSettings.isPending}
            className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
            style={{ background: moderation ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))" }}
          >
            <div
              className="w-5 h-5 rounded-[10px] bg-white"
              style={{
                transform: moderation ? "translateX(18px)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>
      </div>
      <div className="flex gap-4 px-4 pt-3 pb-1.5 bg-hv-surface border-b border-hv-line">
        {(["pendentes", "aprovados"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "py-1.5 text-[13px] capitalize bg-transparent border-0",
              tab === t ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom:
                tab === t ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t === "pendentes" ? `Pendentes (${pending.length})` : "Aprovados"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {tab === "pendentes" ? (
          pLoading ? (
            <Loader />
          ) : pending.length === 0 ? (
            <div className="hv-card p-6 text-center text-sm text-hv-text-2">
              Nenhum post pendente.
            </div>
          ) : (
            pending.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                actions={
                  <>
                    <button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(post.id)}
                      className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                      style={{ background: "hsl(var(--hv-leaf))" }}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      disabled={reject.isPending}
                      onClick={() => {
                        if (confirm("Rejeitar e remover este post?")) reject.mutate(post.id);
                      }}
                      className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                      style={{ background: "hsl(var(--hv-coral))" }}
                    >
                      Rejeitar
                    </button>
                  </>
                }
              />
            ))
          )
        ) : aLoading ? (
          <Loader />
        ) : approved.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhum post aprovado.
          </div>
        ) : (
          approved.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        )}
      </div>
    </div>
  );
}
