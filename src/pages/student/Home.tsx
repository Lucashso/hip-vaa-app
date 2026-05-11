// Home aluno — consolida useStudentHome().
// Respeita: checkin_day_mode, shop_enabled, birthdays_public, class_replacement_enabled.
// Mostra: status header, InvoiceAlert, hero próxima aula, stats, BannerCarousel,
// CTAs (Indicações, Loja*, Passeios), aniversariantes*, modals de saúde + LGPD.
// (*) condicionais.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentHome } from "@/hooks/useStudentHome";
import { useMyHealthQuestionnaire } from "@/hooks/useMyHealthQuestionnaire";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TabBar } from "@/components/TabBar";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { BannerCarousel } from "@/components/BannerCarousel";
import { InvoiceAlert } from "@/components/Alerts/InvoiceAlert";
import { HealthQuestionnaireDialog } from "@/components/Student/HealthQuestionnaireDialog";
import { ConsentDialog } from "@/components/Student/ConsentDialog";
import { getInitial } from "@/lib/utils";

const WEEK_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

interface BirthdayRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  birthdate: string;
}

function useTenantBirthdaysThisWeek(
  tenantId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["tenant-birthdays-week", tenantId],
    queryFn: async (): Promise<BirthdayRow[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, birthdate, tenant_id")
        .eq("tenant_id", tenantId)
        .not("birthdate", "is", null);
      if (error) throw error;

      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay()); // domingo
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      return ((data ?? []) as BirthdayRow[]).filter((p) => {
        if (!p.birthdate) return false;
        const b = new Date(p.birthdate);
        const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
        return thisYear >= start && thisYear < end;
      });
    },
    enabled: enabled && !!tenantId,
  });
}

export default function StudentHome() {
  const navigate = useNavigate();
  const {
    profile,
    tenant,
    settings,
    student,
    isLoading,
    upcoming,
    upcomingCheckedIn,
    monthlyCheckins,
    weeklyCheckins,
    replacementCount,
    credits,
    banners,
    upcomingInvoice,
    isOverdue,
    isDelinquent,
    daysOverdue,
    daysUntilDue,
    statusLabel,
    statusColor,
  } = useStudentHome();

  const { data: healthQ } = useMyHealthQuestionnaire(student?.id);
  const { data: birthdays = [] } = useTenantBirthdaysThisWeek(
    profile?.tenant_id,
    !!settings.birthdays_public,
  );

  // Modais
  const [showHealth, setShowHealth] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const needsHealth =
    !!student?.id &&
    !healthQ?.answered_at &&
    student.health_questionnaire_answered !== true;
  const needsConsent = !!student?.id && student.consent_signed !== true;

  // Auto-abre o primeiro pendente uma vez por sessão.
  useEffect(() => {
    if (!student?.id) return;
    const key = `hip-vaa-modal-${student.id}-shown`;
    if (sessionStorage.getItem(key)) return;
    if (needsConsent) {
      setShowConsent(true);
      sessionStorage.setItem(key, "1");
    } else if (needsHealth) {
      setShowHealth(true);
      sessionStorage.setItem(key, "1");
    }
  }, [student?.id, needsConsent, needsHealth]);

  if (isLoading) return <Loader />;

  const firstName = (profile?.full_name || "Atleta").split(" ")[0];
  const dayMode = settings.checkin_day_mode;
  const showShopCTA = settings.shop_enabled;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header band */}
      <div className="bg-hv-surface border-b border-hv-line">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/perfil")}>
            <div className="w-10 h-10 rounded-[12px] bg-hv-navy text-white grid place-items-center font-display font-extrabold text-lg">
              {getInitial(profile?.full_name)}
            </div>
          </button>
          <div className="flex-1 leading-tight min-w-0">
            <div className="hv-eyebrow">Aloha, {firstName}</div>
            <div className="text-sm font-semibold mt-0.5 truncate flex items-center gap-2">
              <span className="truncate">{tenant?.name || "Hip Va'a"}</span>
              <span
                className="inline-flex items-center gap-1 hv-mono text-[9px] tracking-wider font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: statusColor + "22",
                  color: statusColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: statusColor }}
                />
                {statusLabel.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="relative w-10 h-10 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam"
            aria-label="Notificações"
          >
            <HVIcon name="bell" size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* Invoice alert no topo */}
        <InvoiceAlert
          invoice={upcomingInvoice}
          daysUntilDue={daysUntilDue}
          isOverdue={isOverdue}
          daysOverdue={daysOverdue}
        />

        {/* Pendências: questionário + consentimento (cards inline) */}
        {needsConsent && (
          <button
            type="button"
            onClick={() => setShowConsent(true)}
            className="w-full hv-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform border border-hv-coral/30"
          >
            <div
              className="w-10 h-10 rounded-[12px] grid place-items-center"
              style={{
                background: "hsl(var(--hv-coral) / 0.15)",
                color: "hsl(var(--hv-coral))",
              }}
            >
              <HVIcon name="check" size={20} stroke={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] hv-eyebrow text-hv-coral">
                ASSINE O TERMO
              </div>
              <div className="text-sm font-semibold">Termo de adesão (LGPD)</div>
            </div>
            <HVIcon name="chevron-right" size={18} />
          </button>
        )}

        {!needsConsent && needsHealth && (
          <button
            type="button"
            onClick={() => setShowHealth(true)}
            className="w-full hv-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform border border-hv-amber/30"
          >
            <div
              className="w-10 h-10 rounded-[12px] grid place-items-center"
              style={{
                background: "hsl(var(--hv-amber) / 0.18)",
                color: "hsl(var(--hv-amber))",
              }}
            >
              <HVIcon name="trend" size={20} stroke={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] hv-eyebrow text-hv-amber">
                RESPONDA
              </div>
              <div className="text-sm font-semibold">Questionário de saúde</div>
            </div>
            <HVIcon name="chevron-right" size={18} />
          </button>
        )}

        {/* HERO próxima aula */}
        <div
          className="relative overflow-hidden rounded-[22px] text-white p-5"
          style={{
            background:
              "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 55%, hsl(var(--hv-blue)) 100%)",
            minHeight: 240,
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 360 240"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d="M0 180 Q 90 160 180 180 T 360 180 L 360 240 L 0 240Z"
              fill="hsl(var(--hv-cyan) / 0.18)"
            />
            <path
              d="M0 200 Q 90 178 180 200 T 360 200 L 360 240 L 0 240Z"
              fill="hsl(var(--hv-cyan) / 0.25)"
            />
            <circle cx="320" cy="60" r="44" fill="hsl(var(--hv-amber) / 0.18)" />
            <circle cx="320" cy="60" r="26" fill="hsl(var(--hv-amber) / 0.45)" />
          </svg>

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={{
                  background: "hsl(var(--hv-cyan) / 0.18)",
                  color: "hsl(var(--hv-cyan))",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "hsl(var(--hv-cyan))",
                    boxShadow: "0 0 0 4px hsl(var(--hv-cyan) / 0.25)",
                  }}
                />
                {!upcoming
                  ? "Sem aulas"
                  : upcoming.isToday
                    ? "Próxima · hoje"
                    : "Próxima · amanhã"}
              </div>
              <div
                className="hv-mono text-[10px] tracking-[0.16em] opacity-70"
                aria-hidden
              >
                {dayMode === "today_only"
                  ? "MODO HOJE"
                  : dayMode === "multi_day"
                    ? "HOJE+AMANHÃ"
                    : ""}
              </div>
            </div>

            {upcoming ? (
              <>
                <div className="mt-6">
                  <div className="font-mono text-[11px] tracking-[2px] opacity-70">
                    {upcoming.class.start_time?.slice(0, 5)} —{" "}
                    {upcoming.class.end_time?.slice(0, 5)}
                  </div>
                  <h1 className="font-display text-[34px] leading-[0.95] mt-1.5 text-white">
                    {upcoming.class.venue?.name || "Remada"}
                  </h1>
                  <div className="mt-2 text-[13px] opacity-80">
                    {upcoming.isToday
                      ? `${getGreeting()}, ${firstName}`
                      : `Amanhã · ${WEEK_LABELS[upcoming.date.getDay()]}`}
                  </div>
                </div>

                <div className="mt-6 flex gap-2.5">
                  <button
                    onClick={() => navigate("/checkin")}
                    disabled={isDelinquent}
                    className="flex-1 h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.97] disabled:opacity-50"
                  >
                    {upcomingCheckedIn ? (
                      <>
                        <HVIcon name="check" size={16} stroke={2.4} /> Confirmado
                      </>
                    ) : (
                      <>
                        <HVIcon name="qr" size={16} stroke={2.2} /> Check-in
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate("/aulas")}
                    className="h-12 px-4 rounded-[14px] text-white font-semibold text-[13px]"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    Ver aulas
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <h1 className="font-display text-[28px] text-white leading-tight">
                  Sem remada por aqui
                </h1>
                <button
                  onClick={() => navigate("/aulas")}
                  className="mt-4 h-11 px-5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm inline-flex items-center gap-1.5"
                >
                  Ver grade <HVIcon name="arrow-right" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-[1.2fr_1fr] gap-3">
          <div className="hv-card p-4">
            <div className="flex items-center gap-2 text-hv-coral">
              <HVIcon name="fire" size={18} stroke={2.2} />
              <span className="font-mono text-[11px] tracking-wider font-bold">
                CHECK-INS/MÊS
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <div className="font-display font-extrabold text-[36px] leading-none">
                {monthlyCheckins}
              </div>
              <div className="text-xs text-hv-text-2">
                · {weeklyCheckins} nesta semana
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background:
                      i < monthlyCheckins
                        ? "hsl(var(--hv-coral))"
                        : "hsl(var(--hv-line))",
                    opacity: i < monthlyCheckins ? Math.min(0.5 + i * 0.06, 1) : 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="hv-card p-4 bg-hv-foam">
            <div className="flex items-center gap-2 text-hv-navy">
              <HVIcon name="gift" size={18} stroke={2.2} />
              <span className="font-mono text-[11px] tracking-wider font-bold">
                CRÉDITOS
              </span>
            </div>
            <div className="font-display font-extrabold text-[28px] leading-tight mt-1.5 text-hv-navy">
              R$ {Math.floor((credits?.available_cents || 0) / 100)}
            </div>
            <button
              onClick={() => navigate("/recompensas")}
              className="mt-1 text-[11px] font-semibold text-hv-blue hover:underline"
            >
              Trocar →
            </button>
          </div>
        </div>

        {/* Reposições disponíveis (se feature ligada) */}
        {settings.class_replacement_enabled && (
          <div className="hv-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-hv-foam grid place-items-center text-hv-navy">
              <HVIcon name="paddle" size={18} stroke={2.2} />
            </div>
            <div className="flex-1">
              <div className="hv-mono text-[10px] tracking-wider font-bold text-hv-text-3">
                REPOSIÇÕES
              </div>
              <div className="text-sm font-semibold">
                {replacementCount} usada{replacementCount === 1 ? "" : "s"} no período
              </div>
            </div>
          </div>
        )}

        {/* Banners carousel */}
        {banners.length > 0 && (
          <BannerCarousel
            banners={banners}
            onClick={(b) => {
              if (b.link_url) {
                if (b.link_url.startsWith("http")) {
                  window.open(b.link_url, "_blank");
                } else {
                  navigate(b.link_url);
                }
              }
            }}
          />
        )}

        {/* Aniversariantes */}
        {settings.birthdays_public && birthdays.length > 0 && (
          <div className="hv-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <HVIcon name="gift" size={18} color="hsl(var(--hv-coral))" stroke={2.2} />
              <div className="hv-eyebrow">ANIVERSARIANTES DA SEMANA</div>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-1 px-1">
              {birthdays.map((b) => (
                <div key={b.id} className="shrink-0 w-16 text-center">
                  {b.photo_url ? (
                    <img
                      src={b.photo_url}
                      alt={b.full_name}
                      className="w-12 h-12 rounded-[14px] object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-[14px] bg-hv-navy text-white grid place-items-center font-bold mx-auto">
                      {getInitial(b.full_name)}
                    </div>
                  )}
                  <div className="text-[10px] mt-1 truncate font-semibold">
                    {b.full_name.split(" ")[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hoje — aulas + status check-in */}
        {dayMode !== "today_only" || upcoming ? (
          <div className="hv-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="hv-eyebrow">HOJE</div>
              <button
                type="button"
                onClick={() => navigate("/aulas")}
                className="text-[11px] font-semibold text-hv-blue"
              >
                Ver todas →
              </button>
            </div>
            {upcoming?.isToday ? (
              <div className="flex items-center gap-3">
                <div className="font-mono text-[14px] font-bold text-hv-navy w-16">
                  {upcoming.class.start_time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[14px] truncate">
                    {upcoming.class.venue?.name}
                  </div>
                  <div className="text-[11px] text-hv-text-3 truncate">
                    {upcoming.class.venue?.address || "—"}
                  </div>
                </div>
                {upcomingCheckedIn ? (
                  <span className="hv-chip bg-hv-foam text-hv-leaf font-bold flex items-center gap-1">
                    <HVIcon name="check" size={12} color="hsl(var(--hv-leaf))" stroke={2.4} />
                    OK
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/checkin")}
                    className="hv-chip bg-hv-navy text-white font-bold"
                  >
                    Check-in
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-hv-text-2">
                Sem aulas suas hoje. Volte amanhã 🌊
              </div>
            )}
          </div>
        ) : null}

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/indicacao")}
            className="rounded-[18px] p-4 relative overflow-hidden text-left text-white transition-transform active:scale-[0.97]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--hv-coral)) 0%, hsl(var(--hv-amber)) 100%)",
            }}
          >
            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.18em] opacity-80">
                INDICAÇÕES
              </div>
              <div className="font-display text-[18px] leading-tight mt-1">
                Indique
                <br />& ganhe.
              </div>
            </div>
            <HVIcon
              name="share"
              size={50}
              stroke={1.5}
              color="rgba(255,255,255,0.18)"
              className="absolute -right-1 -bottom-1"
            />
          </button>

          <button
            onClick={() => navigate("/passeios")}
            className="rounded-[18px] p-4 relative overflow-hidden text-left text-white transition-transform active:scale-[0.97]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-blue)) 100%)",
            }}
          >
            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.18em] opacity-80">
                PASSEIOS
              </div>
              <div className="font-display text-[18px] leading-tight mt-1">
                Travessias
                <br />
                da temporada.
              </div>
            </div>
            <HVIcon
              name="boat"
              size={50}
              stroke={1.5}
              color="rgba(255,255,255,0.18)"
              className="absolute -right-1 -bottom-1"
            />
          </button>
        </div>

        {showShopCTA && (
          <button
            onClick={() => navigate("/loja")}
            className="w-full hv-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy">
              <HVIcon name="shop" size={22} stroke={2.2} />
            </div>
            <div className="flex-1">
              <div className="hv-eyebrow">LOJA</div>
              <div className="text-sm font-semibold">Camisetas, remos & mais</div>
            </div>
            <HVIcon name="chevron-right" size={18} />
          </button>
        )}
      </div>

      {/* Modals */}
      {student?.id && profile?.tenant_id && (
        <>
          <HealthQuestionnaireDialog
            open={showHealth}
            onClose={() => setShowHealth(false)}
            studentId={student.id}
            tenantId={profile.tenant_id}
          />
          <ConsentDialog
            open={showConsent}
            onClose={() => setShowConsent(false)}
            studentId={student.id}
          />
        </>
      )}

      <TabBar />
    </div>
  );
}
