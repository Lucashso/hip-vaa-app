// PartnerStrip — strip horizontal scrollable com parceiros (logo + nome).
// Chama useTrackPartnerEvent ao clicar.

import { getInitial } from "@/lib/utils";
import type { Partner } from "@/hooks/usePartners";
import { useTrackPartnerEvent } from "@/hooks/useCommunityMutations";
import { useAuth } from "@/hooks/useAuth";

const PARTNER_COLORS = ["#7B2D9F", "#1B6FB0", "#7A4A1F", "#FF6B4A", "#2FB37A"];

interface PartnerStripProps {
  partners: Partner[];
  tenantId?: string;
}

export function PartnerStrip({ partners, tenantId }: PartnerStripProps) {
  const { profile } = useAuth();
  const trackEvent = useTrackPartnerEvent();

  if (partners.length === 0) return null;

  const handleClick = (partner: Partner) => {
    if (tenantId && profile?.id) {
      trackEvent.mutate({
        partnerId: partner.id,
        tenantId,
        studentId: profile.id,
        eventType: "view",
      });
    }
  };

  return (
    <div>
      <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-2">
        PARCEIROS DO CLUBE
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
        {partners.slice(0, 8).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleClick(p)}
            className="shrink-0 px-3.5 py-2.5 rounded-[12px] bg-hv-surface border border-hv-line text-[12px] font-semibold flex gap-2 items-center active:scale-[0.96] transition-transform"
          >
            {p.logo_url ? (
              <img
                src={p.logo_url}
                alt={p.name}
                className="w-[22px] h-[22px] rounded-md object-cover"
              />
            ) : (
              <div
                className="w-[22px] h-[22px] rounded-md grid place-items-center text-white text-[10px] font-bold"
                style={{ background: PARTNER_COLORS[i % PARTNER_COLORS.length] }}
              >
                {getInitial(p.name)}
              </div>
            )}
            <span className="max-w-[100px] truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
