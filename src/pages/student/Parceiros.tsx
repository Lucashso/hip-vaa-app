// Parceiros do clube — strip horizontal + cards de benefícios com ações.

import { useMemo } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { usePartners, usePartnerActions, type PartnerAction } from "@/hooks/usePartners";
import { getInitial } from "@/lib/utils";
import { toast } from "sonner";

const PARTNER_COLORS = [
  "#7B2D9F",
  "#1B6FB0",
  "#7A4A1F",
  "#FF6B4A",
  "#2FB37A",
  "#0E3A5F",
  "#FFB347",
  "#9E2A5E",
];

function colorFor(idx: number): string {
  return PARTNER_COLORS[idx % PARTNER_COLORS.length];
}

function actionDisplay(a: PartnerAction): { label: string; code: string } {
  switch ((a.action_type || "").toLowerCase()) {
    case "code":
    case "coupon":
      return { label: a.label, code: a.value || "—" };
    case "checkin":
    case "auto":
      return { label: a.label, code: "via check-in" };
    case "whatsapp":
      return { label: a.label, code: a.value || "WhatsApp" };
    case "link":
    case "url":
      return { label: a.label, code: "abrir" };
    default:
      return { label: a.label, code: a.value || "" };
  }
}

export default function StudentParceiros() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || undefined;
  const { data: partners = [], isLoading } = usePartners(tenantId);
  const partnerIds = useMemo(() => partners.map((p) => p.id), [partners]);
  const { data: actions = [] } = usePartnerActions(partnerIds);

  // Group primary action per partner
  const primaryByPartner = useMemo(() => {
    const map = new Map<string, PartnerAction>();
    for (const a of actions) {
      const existing = map.get(a.partner_id);
      if (!existing) map.set(a.partner_id, a);
      else if (a.is_primary && !existing.is_primary) map.set(a.partner_id, a);
    }
    return map;
  }, [actions]);

  const handleCopy = async (code: string) => {
    if (!code || code === "via check-in") return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não rolou copiar.");
    }
  };

  return (
    <PageScaffold eyebrow="BENEFÍCIOS DO CLUBE" title="Parceiros">
      {isLoading ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Carregando parceiros…
        </div>
      ) : partners.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="gift" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">
            Em breve
          </div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[260px] mx-auto">
            Seu clube ainda não cadastrou parceiros. Logo logo aparecem benefícios aqui.
          </div>
        </div>
      ) : (
        <>
          {/* Strip horizontal */}
          <div className="flex gap-2.5 overflow-x-auto pb-3.5 -mx-1 px-1">
            {partners.map((p, i) => (
              <div
                key={p.id}
                className="shrink-0 w-[92px] px-2.5 py-3.5 rounded-[14px] bg-hv-surface border border-hv-line text-center"
              >
                {p.logo_url ? (
                  <img
                    src={p.logo_url}
                    alt={p.name}
                    className="w-11 h-11 mx-auto rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-11 h-11 mx-auto rounded-full grid place-items-center text-white font-display font-extrabold"
                    style={{ background: colorFor(i) }}
                  >
                    {getInitial(p.name)}
                  </div>
                )}
                <div className="text-[11px] font-semibold mt-1.5 truncate">
                  {p.name}
                </div>
              </div>
            ))}
          </div>

          {/* Cards de benefício */}
          <h3 className="text-[12px] uppercase tracking-[1.4px] text-hv-text-2 font-bold mb-2.5">
            Benefícios ativos
          </h3>
          {partners.map((p, i) => {
            const action = primaryByPartner.get(p.id);
            const c = colorFor(i);
            const disp = action ? actionDisplay(action) : null;
            return (
              <div
                key={p.id}
                className="hv-card p-3.5 mb-2.5 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 bottom-0 w-1.5"
                  style={{ background: c }}
                />
                <div className="flex items-start gap-3">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.name}
                      className="w-[42px] h-[42px] rounded-[12px] object-cover"
                    />
                  ) : (
                    <div
                      className="w-[42px] h-[42px] rounded-[12px] grid place-items-center text-white font-extrabold font-display"
                      style={{ background: c }}
                    >
                      {getInitial(p.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="hv-mono text-[9px] text-hv-text-3 tracking-[0.14em] font-bold">
                      {p.name.toUpperCase()}
                    </div>
                    <div className="text-sm font-bold mt-0.5">
                      {disp?.label || "Benefício exclusivo"}
                    </div>
                    {p.description && (
                      <div className="text-[11px] text-hv-text-3 mt-1 leading-[1.4]">
                        {p.description}
                      </div>
                    )}
                    {disp && (
                      <div className="mt-2.5 flex gap-1.5 items-center">
                        <span
                          className="hv-mono px-2 py-1 rounded-md bg-hv-bg text-[11px] font-bold tracking-wider border border-dashed border-hv-line"
                          style={{ color: c }}
                        >
                          {disp.code}
                        </span>
                        {disp.code !== "via check-in" && disp.code !== "" && (
                          <button
                            type="button"
                            onClick={() => handleCopy(disp.code)}
                            className="text-hv-text-3 hover:text-foreground"
                          >
                            <HVIcon name="copy" size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </PageScaffold>
  );
}
