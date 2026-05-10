// Recompensas — saldo + grid de rewards + histórico de resgates.

import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyCredits } from "@/hooks/useStudent";
import {
  useActiveRewards,
  useMyRedemptions,
  useRedeemReward,
} from "@/hooks/useReferrals";
import { HVIcon } from "@/lib/HVIcon";
import { formatBRL } from "@/lib/utils";

interface RedemptionRow {
  id: string;
  consumed_cents: number;
  status: string;
  created_at: string;
  reward?: { name: string } | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StudentRecompensas() {
  const { data: student } = useMyStudent();
  const { data: credits } = useMyCredits(student?.id);
  const { data: rewards = [] } = useActiveRewards();
  const { data: redemptions = [] } = useMyRedemptions();
  const redeem = useRedeemReward();

  const available = credits?.available_cents || 0;

  const handleRedeem = (rewardId: string, name: string, cost: number) => {
    const ok = window.confirm(
      `Resgatar "${name}" por ${formatBRL(cost)}?\n\nSaldo após: ${formatBRL(
        Math.max(0, available - cost),
      )}`,
    );
    if (!ok) return;
    redeem.mutate(rewardId);
  };

  return (
    <PageScaffold eyebrow="CATÁLOGO" title="Recompensas">
      {/* Saldo banner */}
      <div
        className="relative overflow-hidden rounded-[22px] text-white p-5"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--hv-coral)) 0%, hsl(var(--hv-amber)) 100%)",
        }}
      >
        <div className="hv-eyebrow text-white/85">SEU SALDO</div>
        <div className="font-display font-extrabold text-[44px] leading-none mt-2 text-white">
          {formatBRL(available)}
        </div>
        <div className="text-sm text-white/90 mt-2">
          Troca por prêmios da casa
        </div>
        <HVIcon
          name="gift"
          size={92}
          stroke={1.4}
          color="rgba(255,255,255,0.22)"
          className="absolute -right-2 -bottom-2"
        />
      </div>

      {/* Grid rewards */}
      {rewards.length === 0 ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">
          Nenhuma recompensa ativa no momento.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((r) => {
            const canRedeem = available >= r.cost_cents;
            const outOfStock = r.stock !== null && r.stock <= 0;
            return (
              <button
                key={r.id}
                type="button"
                disabled={!canRedeem || outOfStock || redeem.isPending}
                onClick={() => handleRedeem(r.id, r.name, r.cost_cents)}
                className="hv-card overflow-hidden text-left active:scale-[0.97] transition-transform disabled:opacity-60"
              >
                <div
                  className="relative h-28 grid place-items-center text-white"
                  style={{
                    background:
                      "linear-gradient(155deg, hsl(var(--hv-navy)) 0%, hsl(var(--hv-blue)) 100%)",
                  }}
                >
                  {r.photo_url ? (
                    <img
                      src={r.photo_url}
                      alt={r.name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <HVIcon
                      name="gift"
                      size={42}
                      color="rgba(255,255,255,0.9)"
                      stroke={1.4}
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-display text-[14px] leading-tight line-clamp-2">
                    {r.name}
                  </div>
                  {r.description && (
                    <div className="text-[11px] text-hv-text-3 mt-0.5 line-clamp-2">
                      {r.description}
                    </div>
                  )}
                  <div className="font-mono font-bold text-[14px] text-hv-coral mt-2">
                    {formatBRL(r.cost_cents)}
                  </div>
                  {outOfStock && (
                    <div className="text-[10px] text-hv-text-3 mt-1 uppercase tracking-wider">
                      Esgotado
                    </div>
                  )}
                  {!outOfStock && !canRedeem && (
                    <div className="text-[10px] text-hv-text-3 mt-1 uppercase tracking-wider">
                      Saldo insuficiente
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Histórico */}
      <div>
        <h3 className="hv-eyebrow mb-2">Histórico de resgates</h3>
        {redemptions.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhum resgate ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {(redemptions as RedemptionRow[]).map((red) => (
              <div key={red.id} className="hv-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy">
                  <HVIcon name="trophy" size={18} stroke={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[14px] truncate">
                    {red.reward?.name || "Recompensa"}
                  </div>
                  <div className="text-[11px] text-hv-text-3 mt-0.5">
                    {formatDate(red.created_at)}
                  </div>
                </div>
                <div className="font-mono text-[13px] font-bold text-hv-coral">
                  -{formatBRL(red.consumed_cents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
