// Passeios — featured card + lista de tour_dates.

import { PageScaffold } from "@/components/PageScaffold";
import { useAuth } from "@/hooks/useAuth";
import { useUpcomingTourDates, useCreateTourBooking } from "@/hooks/useTours";
import { HVIcon } from "@/lib/HVIcon";
import { formatBRL } from "@/lib/utils";
import { toast } from "sonner";

function formatTourDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();
}

export default function StudentPasseios() {
  const { profile } = useAuth();
  const { data: tourDates = [], isLoading } = useUpcomingTourDates(
    profile?.tenant_id || undefined,
  );
  const createBooking = useCreateTourBooking();

  const handleBook = (tourDateId: string) => {
    createBooking.mutate(
      {
        tour_date_id: tourDateId,
        buyer_name: profile?.full_name || undefined,
        buyer_email: profile?.email || undefined,
        buyer_phone: profile?.phone || undefined,
        buyer_cpf: profile?.cpf || undefined,
      },
      {
        onSuccess: () => toast.success("Reserva criada! Confira no Plano."),
      },
    );
  };

  const [featured, ...rest] = tourDates;

  return (
    <PageScaffold eyebrow="TEMPORADA 2025" title="Passeios">
      {isLoading ? (
        <div className="hv-card p-6 text-center text-sm text-hv-text-2">Carregando…</div>
      ) : tourDates.length === 0 ? (
        <div className="hv-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-[16px] bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="boat" size={26} color="hsl(var(--hv-navy))" />
          </div>
          <div className="font-display text-[18px] text-hv-navy">Em breve</div>
          <div className="text-sm text-hv-text-2 mt-1.5 max-w-[260px] mx-auto">
            Sem passeios programados nesse momento. Fique de olho — temporada chegando.
          </div>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <div
              className="relative overflow-hidden rounded-[22px] text-white p-5"
              style={{
                background:
                  "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 55%, hsl(var(--hv-blue)) 100%)",
                minHeight: 320,
              }}
            >
              <svg
                aria-hidden
                viewBox="0 0 360 320"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <path
                  d="M0 240 Q 90 215 180 240 T 360 240 L 360 320 L 0 320Z"
                  fill="hsl(var(--hv-cyan) / 0.18)"
                />
                <path
                  d="M0 270 Q 90 245 180 270 T 360 270 L 360 320 L 0 320Z"
                  fill="hsl(var(--hv-cyan) / 0.28)"
                />
                <circle cx="310" cy="60" r="38" fill="hsl(var(--hv-amber) / 0.2)" />
                <circle cx="310" cy="60" r="22" fill="hsl(var(--hv-amber) / 0.4)" />
              </svg>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="hv-chip bg-white/15 text-white">EM DESTAQUE</div>
                  <div className="hv-chip bg-hv-cyan/25 text-hv-cyan">
                    {Math.max(0, featured.total_slots - featured.filled_slots)} VAGAS
                  </div>
                </div>

                <div className="mt-6">
                  <div className="font-mono text-[11px] tracking-[0.2em] text-white/70">
                    {formatTourDate(featured.date)}
                  </div>
                  <h2 className="font-display text-[28px] leading-tight mt-1 text-white">
                    {featured.tour?.title || "Travessia"}
                  </h2>
                  <p className="text-[13px] text-white/80 mt-2 max-w-[320px] line-clamp-2">
                    {featured.tour?.description || "Travessia oceânica guiada com remada coletiva e parada técnica."}
                  </p>
                </div>

                {/* Progress de ocupação */}
                <div className="mt-5">
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-white/70">
                    <span>OCUPAÇÃO</span>
                    <span>
                      {featured.filled_slots}/{featured.total_slots}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-hv-cyan rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          featured.total_slots > 0
                            ? (featured.filled_slots / featured.total_slots) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="hv-eyebrow text-white/60">A PARTIR DE</div>
                    <div className="font-display font-extrabold text-[34px] leading-none mt-1">
                      {formatBRL(featured.price_cents)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBook(featured.id)}
                    disabled={createBooking.isPending}
                    className="h-12 px-5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm inline-flex items-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-60"
                  >
                    Quero ir <HVIcon name="arrow-right" size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Demais datas */}
          {rest.length > 0 && (
            <div>
              <h3 className="hv-eyebrow mb-2">Próximas datas</h3>
              <div className="space-y-2">
                {rest.map((td) => {
                  const left = Math.max(0, td.total_slots - td.filled_slots);
                  return (
                    <div key={td.id} className="hv-card p-4 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-[14px] bg-hv-foam grid place-items-center text-hv-navy text-center leading-tight">
                        <div>
                          <div className="font-display font-extrabold text-[18px]">
                            {new Date(td.date + "T00:00:00").getDate()}
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-wider">
                            {new Date(td.date + "T00:00:00")
                              .toLocaleDateString("pt-BR", { month: "short" })
                              .replace(".", "")}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-[15px] truncate">
                          {td.tour?.title || "Travessia"}
                        </div>
                        <div className="text-[11px] text-hv-text-3 mt-0.5">
                          {left} vaga{left === 1 ? "" : "s"} · {formatBRL(td.price_cents)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBook(td.id)}
                        disabled={createBooking.isPending}
                        className="h-9 px-3 rounded-[10px] bg-hv-navy text-white text-[12px] font-bold active:scale-[0.97] transition-transform disabled:opacity-60"
                      >
                        Reservar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </PageScaffold>
  );
}
