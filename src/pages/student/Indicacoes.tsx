// Indicações — saldo + link mágico + rede de indicados.

import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyCredits } from "@/hooks/useStudent";
import { useReferralCode, useMyReferrals } from "@/hooks/useReferrals";
import { HVIcon } from "@/lib/HVIcon";
import { cn, formatBRL, getInitial } from "@/lib/utils";
import { toast } from "sonner";

function statusChip(status: "pending" | "matriculated" | "cancelled"): {
  label: string;
  className: string;
} {
  switch (status) {
    case "matriculated":
      return { label: "MATRICULOU", className: "bg-hv-leaf/15 text-hv-leaf" };
    case "cancelled":
      return { label: "CANCELOU", className: "bg-hv-line text-hv-text-3" };
    default:
      return { label: "AGUARDANDO", className: "bg-hv-amber/20 text-hv-amber" };
  }
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, hsl(var(--hv-cyan)), hsl(var(--hv-blue)))",
  "linear-gradient(135deg, hsl(var(--hv-coral)), hsl(var(--hv-amber)))",
  "linear-gradient(135deg, hsl(var(--hv-navy)), hsl(var(--hv-cyan)))",
  "linear-gradient(135deg, hsl(var(--hv-amber)), hsl(var(--hv-coral)))",
];

export default function StudentIndicacoes() {
  const { data: student } = useMyStudent();
  const { data: credits } = useMyCredits(student?.id);
  const { data: referralCode } = useReferralCode(student?.id);
  const { data: referrals = [] } = useMyReferrals(student?.id);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = referralCode ? `${origin}/?ref=${referralCode}` : "";

  const totalCents = credits?.available_cents || 0;
  const hasReferrals = referrals.length > 0;

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não rolou copiar — tenta de novo.");
    }
  };

  const handleWhats = () => {
    if (!inviteLink) return;
    const text = encodeURIComponent(
      `Bora remar comigo? Usa meu link e a gente ganha crédito juntos: ${inviteLink}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hip Va'a",
          text: "Bora remar comigo?",
          url: inviteLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <PageScaffold eyebrow="INDICAÇÕES & CRÉDITOS" title="Sua rede">
      {/* Hero saldo */}
      <div
        className="relative overflow-hidden rounded-[22px] text-white p-5"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--hv-coral)) 0%, hsl(var(--hv-amber)) 100%)",
          minHeight: 200,
        }}
      >
        <div className="hv-eyebrow text-white/85">SALDO DE CRÉDITOS</div>
        <div className="font-display font-extrabold text-[56px] leading-none mt-2 text-white">
          {formatBRL(totalCents)}
        </div>
        <div className="text-sm text-white/90 mt-3 max-w-[280px]">
          {hasReferrals
            ? "+R$50 quando próximo amigo pagar"
            : "Indique amigos pra começar a acumular"}
        </div>
        <HVIcon
          name="gift"
          size={120}
          stroke={1.2}
          color="rgba(255,255,255,0.18)"
          className="absolute -right-4 -bottom-4"
        />
      </div>

      {/* Link mágico */}
      <div
        className="rounded-[18px] p-4 bg-hv-surface"
        style={{
          border: "2px dashed hsl(var(--hv-coral) / 0.5)",
        }}
      >
        <div className="hv-eyebrow text-hv-coral">SEU LINK MÁGICO</div>
        <div className="font-mono text-[13px] text-foreground mt-1.5 break-all">
          {inviteLink || "Gerando link…"}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="h-11 rounded-[12px] bg-hv-navy text-white text-[12px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <HVIcon name="copy" size={14} /> Copiar
          </button>
          <button
            type="button"
            onClick={handleWhats}
            className="h-11 rounded-[12px] bg-hv-leaf text-white text-[12px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <HVIcon name="zap" size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="h-11 rounded-[12px] bg-hv-surface border border-hv-line text-foreground text-[12px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <HVIcon name="share" size={14} /> Compartilhar
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="hv-card p-4">
        <h3 className="hv-eyebrow mb-3">Como funciona</h3>
        <ol className="space-y-3">
          {[
            { n: "1", t: "Compartilhe seu link", d: "Manda pro amigo que tá afim de remar" },
            { n: "2", t: "Amigo se matricula", d: "Ele entra usando o seu link" },
            { n: "3", t: "Você ganha R$50", d: "Crédito automático na sua conta" },
          ].map((s) => (
            <li key={s.n} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-hv-coral text-white grid place-items-center font-display font-bold text-sm shrink-0">
                {s.n}
              </div>
              <div>
                <div className="text-[14px] font-bold leading-tight">{s.t}</div>
                <div className="text-[12px] text-hv-text-2 mt-0.5">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Rede */}
      <div>
        <h3 className="hv-eyebrow mb-2">Sua rede ({referrals.length})</h3>
        {referrals.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Ninguém indicado ainda. Manda o link aí.
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r, idx) => {
              const info = statusChip(r.status);
              const label = r.referred_email || "Convidado";
              return (
                <div key={r.id} className="hv-card p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full grid place-items-center text-white font-display font-bold text-[14px]"
                    style={{
                      background:
                        AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
                    }}
                  >
                    {getInitial(label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold truncate">{label}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5">
                      {r.reward_cents > 0
                        ? `Recompensa ${formatBRL(r.reward_cents)}`
                        : "Recompensa quando matricular"}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                      info.className,
                    )}
                  >
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
