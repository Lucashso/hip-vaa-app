// Admin · Comunidade — moderação + stats + lista posts.
// Baseado em admin-mobile.jsx HVAdminComunidade.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const AVATAR_COLORS = ["#FF6B4A", "#F2B544", "#7B2D9F", "#1B6FB0", "#2FB37A", "#25C7E5"];

interface CommunityPost {
  id: string;
  tenant_id: string | null;
  caption: string | null;
  author_id: string;
  is_approved: boolean | null;
  created_at: string;
  author?: { full_name: string } | null;
}

function useCommunityPosts(tenantId: string | null) {
  return useQuery({
    queryKey: ["admin", "comunidade", tenantId],
    queryFn: async (): Promise<{ posts: CommunityPost[]; total: number; active: number }> => {
      if (!tenantId) return { posts: [], total: 0, active: 0 };
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [postsRes, monthRes, activeRes] = await Promise.all([
        supabase
          .from("community_posts")
          .select(
            "id, tenant_id, caption, author_id, is_approved, created_at, author:profiles!community_posts_author_id_fkey(full_name)",
          )
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", monthStart),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("active", true),
      ]);
      return {
        posts: ((postsRes.data ?? []) as unknown as CommunityPost[]),
        total: monthRes.count ?? 0,
        active: activeRes.count ?? 0,
      };
    },
    enabled: !!tenantId,
  });
}

function statusChip(isApproved: boolean | null): { label: string; color: string; bg: string } {
  if (isApproved === null || isApproved === undefined)
    return {
      label: "aguardando aprovação",
      color: "hsl(var(--hv-amber))",
      bg: "rgba(242,181,68,0.18)",
    };
  if (!isApproved)
    return { label: "ocultado", color: "hsl(var(--hv-coral))", bg: "rgba(255,107,74,0.18)" };
  return { label: "publicado", color: "hsl(var(--hv-leaf))", bg: "rgba(47,179,122,0.18)" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function AdminComunidade() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data, isLoading } = useCommunityPosts(tenantId);
  const [moderation, setModeration] = useState(false);

  const posts = data?.posts ?? [];
  const monthCount = data?.total ?? 0;
  const activeCount = data?.active ?? 0;

  const stats = [
    { l: "POSTS MÊS", v: String(monthCount) },
    { l: "ENG. MÉDIO", v: posts.length > 0 ? String(Math.round(posts.length / 2)) : "0" },
    { l: "ATIVOS", v: String(activeCount) },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Comunidade" sub={`MODERAÇÃO · ${activeCount} MEMBROS`} />
      <div className="px-4 pt-3">
        <div className="hv-card flex justify-between items-center" style={{ padding: 14 }}>
          <div className="min-w-0">
            <div className="text-[13px] font-bold">Aprovar antes de publicar</div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">Moderação ativa para todos</div>
          </div>
          <button
            type="button"
            onClick={() => setModeration((v) => !v)}
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
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          {stats.map((k) => (
            <div key={k.l} className="hv-card p-2.5 text-center">
              <div
                className="hv-mono text-[9px] text-hv-text-3 font-bold"
                style={{ letterSpacing: "0.1em" }}
              >
                {k.l}
              </div>
              <div className="font-display text-[18px] font-extrabold mt-0.5">{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : posts.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhum post na comunidade.
          </div>
        ) : (
          posts.map((p, i) => {
            const cor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const ch = statusChip(p.is_approved);
            const name = p.author?.full_name || "—";
            return (
              <div key={p.id} className="hv-card mb-2" style={{ padding: 12 }}>
                <div className="flex gap-2.5 items-center">
                  <div
                    className="w-8 h-8 rounded-[16px] grid place-items-center text-white font-bold"
                    style={{ background: cor, fontFamily: "var(--hv-font-display)" }}
                  >
                    {(name[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate">{name}</div>
                    <div className="hv-mono text-[10px] text-hv-text-3">{timeAgo(p.created_at)}</div>
                  </div>
                  <span className="hv-chip" style={{ background: ch.bg, color: ch.color }}>
                    {ch.label}
                  </span>
                </div>
                <p className="text-[12px] text-hv-text-2 mt-2" style={{ lineHeight: 1.5 }}>
                  {p.caption || "—"}
                </p>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-semibold text-hv-text"
                    style={{
                      background: "hsl(var(--hv-bg))",
                      border: "1px solid hsl(var(--hv-line))",
                    }}
                  >
                    Fixar
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-semibold text-hv-text"
                    style={{
                      background: "hsl(var(--hv-bg))",
                      border: "1px solid hsl(var(--hv-line))",
                    }}
                  >
                    Ocultar
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                    style={{ background: "hsl(var(--hv-coral))" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
