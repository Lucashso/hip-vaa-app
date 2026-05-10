// TourLanding — landpage pública por slug (sem auth).

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { HVLogo } from "@/components/HVLogo";
import { HVIcon } from "@/lib/HVIcon";
import { useCreateTourBooking, type Tour, type TourDate } from "@/hooks/useTours";
import { Input } from "@/components/Input";
import { cn, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface TourWithDates extends Tour {
  tour_dates: TourDate[];
  tenant: { id: string; name: string; slug: string | null } | null;
}

function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatTourDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default function TourLanding() {
  const { tenantSlug, tourSlug } = useParams<{
    tenantSlug: string;
    tourSlug: string;
  }>();

  const { data: tour, isLoading } = useQuery({
    queryKey: ["public-tour", tenantSlug, tourSlug],
    queryFn: async (): Promise<TourWithDates | null> => {
      if (!tenantSlug || !tourSlug) return null;
      const { data, error } = await supabase
        .from("tours")
        .select(
          "*, tenant:tenants!inner(id, name, slug), tour_dates(*)",
        )
        .eq("slug", tourSlug)
        .eq("tenant.slug", tenantSlug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TourWithDates;
    },
  });

  const upcoming = useMemo(() => {
    if (!tour?.tour_dates) return [];
    const today = new Date().toISOString().split("T")[0];
    return tour.tour_dates
      .filter((td) => td.active && td.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tour]);

  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [pixResult, setPixResult] = useState<{
    pix_qr: string | null;
    pix_qr_base64: string | null;
    amount_cents: number;
  } | null>(null);

  useEffect(() => {
    if (upcoming.length && !selectedDateId) setSelectedDateId(upcoming[0].id);
  }, [upcoming, selectedDateId]);

  const createBooking = useCreateTourBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateId) {
      toast.error("Escolhe uma data primeiro");
      return;
    }
    if (!name || !email) {
      toast.error("Preenche nome e e-mail");
      return;
    }
    try {
      const result = await createBooking.mutateAsync({
        tour_date_id: selectedDateId,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone || undefined,
        buyer_cpf: cpf || undefined,
      });
      setPixResult({
        pix_qr: result.pix_qr,
        pix_qr_base64: result.pix_qr_base64,
        amount_cents: result.amount_cents,
      });
      toast.success("Reserva criada! Pague o PIX pra confirmar.");
    } catch {
      /* handler já mostra toast */
    }
  };

  const handleCopyPix = async () => {
    if (!pixResult?.pix_qr) return;
    try {
      await navigator.clipboard.writeText(pixResult.pix_qr);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Não rolou copiar — tenta de novo.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-hv-text-2">
        Carregando…
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-hv-line bg-hv-surface">
          <div className="max-w-2xl mx-auto px-5 py-4">
            <HVLogo size={36} color="hsl(var(--hv-navy))" />
          </div>
        </header>
        <main className="flex-1 grid place-items-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto rounded-[18px] bg-hv-foam grid place-items-center mb-4">
              <HVIcon name="boat" size={28} color="hsl(var(--hv-navy))" />
            </div>
            <h1 className="font-display text-[26px] text-hv-navy">
              Passeio não encontrado
            </h1>
            <p className="text-sm text-hv-text-2 mt-2">
              O link pode estar quebrado ou esse passeio não está mais disponível.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-hv-line bg-hv-surface">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <HVLogo size={32} color="hsl(var(--hv-navy))" />
          <div>
            <div className="hv-eyebrow">{tour.tenant?.name || "Hip Va'a"}</div>
            <div className="text-[13px] font-bold leading-none mt-0.5">
              Reserva online
            </div>
          </div>
        </div>
      </header>

      {/* Hero gigante */}
      <div
        className="relative overflow-hidden text-white px-6 pt-10 pb-14"
        style={{
          background:
            "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 55%, hsl(var(--hv-blue)) 100%)",
          minHeight: 280,
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 800 280"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <path
            d="M0 210 Q 200 180 400 210 T 800 210 L 800 280 L 0 280Z"
            fill="hsl(var(--hv-cyan) / 0.16)"
          />
          <path
            d="M0 240 Q 200 210 400 240 T 800 240 L 800 280 L 0 280Z"
            fill="hsl(var(--hv-cyan) / 0.25)"
          />
          <circle cx="700" cy="70" r="50" fill="hsl(var(--hv-amber) / 0.18)" />
          <circle cx="700" cy="70" r="30" fill="hsl(var(--hv-amber) / 0.42)" />
        </svg>

        <div className="relative max-w-2xl mx-auto">
          <div className="hv-chip bg-white/15 text-white">TEMPORADA 2025</div>
          <h1 className="font-display text-[42px] leading-[1.02] mt-4 text-white">
            {tour.title}
          </h1>
          {tour.description && (
            <p className="text-[14px] text-white/85 mt-3 max-w-[480px]">
              {tour.description}
            </p>
          )}
          <div className="flex gap-2 mt-4 flex-wrap">
            {tour.distance_km && (
              <span className="hv-chip bg-white/15 text-white">
                {tour.distance_km} km
              </span>
            )}
            {tour.level && (
              <span className="hv-chip bg-white/15 text-white">{tour.level}</span>
            )}
            <span className="hv-chip bg-hv-cyan/25 text-hv-cyan">
              {formatBRL(tour.default_price_cents)}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Datas */}
        <section>
          <h3 className="hv-eyebrow mb-2">Escolha sua data</h3>
          {upcoming.length === 0 ? (
            <div className="hv-card p-6 text-center text-sm text-hv-text-2">
              Sem datas disponíveis. Aguarde o próximo anúncio.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((td) => {
                const left = Math.max(0, td.total_slots - td.filled_slots);
                const selected = selectedDateId === td.id;
                const full = left === 0;
                return (
                  <button
                    key={td.id}
                    type="button"
                    onClick={() => !full && setSelectedDateId(td.id)}
                    disabled={full}
                    className={cn(
                      "w-full hv-card p-4 flex items-center gap-3 text-left transition-all",
                      selected
                        ? "border-hv-navy ring-2 ring-hv-navy/15"
                        : "hover:bg-hv-foam/40",
                      full && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="w-14 h-14 rounded-[14px] bg-hv-foam grid place-items-center text-hv-navy text-center leading-tight">
                      <div>
                        <div className="font-display font-extrabold text-[20px]">
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
                      <div className="font-display text-[15px] capitalize truncate">
                        {formatTourDate(td.date)}
                      </div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5">
                        {full ? "Esgotado" : `${left} vagas`} ·{" "}
                        {formatBRL(td.price_cents)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 grid place-items-center",
                        selected ? "border-hv-navy bg-hv-navy" : "border-hv-line",
                      )}
                    >
                      {selected && <HVIcon name="check" size={12} color="white" stroke={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Form ou PIX */}
        {!pixResult ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="hv-eyebrow mb-2">Seus dados</h3>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="Telefone (com DDD)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              maxLength={14}
            />
            <button
              type="submit"
              disabled={createBooking.isPending || upcoming.length === 0}
              className="w-full h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              {createBooking.isPending ? "Gerando PIX…" : "Reservar com PIX"}{" "}
              <HVIcon name="arrow-right" size={16} />
            </button>
          </form>
        ) : (
          <section className="hv-card p-5 text-center space-y-3">
            <div className="hv-eyebrow">PAGAMENTO PIX</div>
            <div className="font-display text-[28px] text-hv-navy">
              {formatBRL(pixResult.amount_cents)}
            </div>
            {pixResult.pix_qr_base64 ? (
              <img
                src={`data:image/png;base64,${pixResult.pix_qr_base64}`}
                alt="QR Code PIX"
                className="mx-auto w-56 h-56 rounded-[18px] border border-hv-line"
              />
            ) : (
              <div className="w-56 h-56 mx-auto rounded-[18px] bg-hv-foam grid place-items-center text-hv-navy">
                <HVIcon name="qr" size={48} />
              </div>
            )}
            {pixResult.pix_qr && (
              <>
                <div className="font-mono text-[11px] text-hv-text-3 break-all bg-hv-foam rounded-[12px] p-3 max-h-24 overflow-auto">
                  {pixResult.pix_qr}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full h-11 rounded-[12px] bg-hv-navy text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <HVIcon name="copy" size={14} /> Copiar código PIX
                </button>
              </>
            )}
            <div className="text-[11px] text-hv-text-3 mt-2">
              Sua reserva é confirmada automaticamente quando o pagamento cair.
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-hv-line bg-hv-surface mt-6">
        <div className="max-w-2xl mx-auto px-5 py-6 text-center text-[11px] text-hv-text-3">
          Powered by Hip Va'a · {tour.tenant?.name}
        </div>
      </footer>
    </div>
  );
}
