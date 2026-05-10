// Comunidade — feed de posts aprovados + strip de parceiros.

import { useMemo } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunity";
import { usePartners } from "@/hooks/usePartners";
import { getInitial } from "@/lib/utils";

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
  const { data: posts = [], isLoading } = useCommunityPosts(tenantId);
  const { data: partners = [] } = usePartners(tenantId);

  const subtitle = useMemo(() => {
    if (posts.length === 0) return "COMUNIDADE HIP VA'A";
    return `${posts.length} POSTS RECENTES`;
  }, [posts.length]);

  const partnerStrip = partners.slice(0, 8);

  return (
    <PageScaffold
      eyebrow={subtitle}
      title="Comunidade"
      trailing={
        <button
          type="button"
          className="w-9 h-9 rounded-[12px] bg-hv-navy text-white border-none grid place-items-center active:scale-[0.96] transition-transform"
        >
          <HVIcon name="plus" size={18} stroke={2.4} />
        </button>
      }
    >
      {/* Parceiros strip */}
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

      {/* Posts */}
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
                  <button
                    type="button"
                    className="text-hv-text-3 hover:text-foreground"
                  >
                    <HVIcon name="menu" size={18} />
                  </button>
                </div>
                {p.caption && (
                  <p className="text-[13px] leading-[1.55] mt-2.5 text-foreground">
                    {p.caption}
                  </p>
                )}
                {p.image_url ? (
                  <div className="mt-2.5 h-[140px] rounded-[12px] overflow-hidden relative">
                    <img
                      src={p.image_url}
                      alt={p.caption || name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : i === 0 ? (
                  <div
                    className="mt-2.5 h-[140px] rounded-[12px] relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0E3A5F, #25C7E5)" }}
                  >
                    <svg
                      viewBox="0 0 360 140"
                      className="absolute inset-0 w-full h-full"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 100 Q90 80 180 100 T360 100 L360 140 L0 140Z"
                        fill="rgba(255,255,255,0.2)"
                      />
                    </svg>
                  </div>
                ) : null}
                <div className="flex gap-4 mt-3 text-[12px] text-hv-text-2">
                  <span className="flex items-center gap-1">
                    <HVIcon name="star" size={14} color="hsl(var(--hv-coral))" />
                    {p.likes_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <HVIcon name="bell" size={14} />
                    {p.comments_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <HVIcon name="share" size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageScaffold>
  );
}
