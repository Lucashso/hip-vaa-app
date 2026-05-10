// Admin · Banners & Avisos — tabs com toggles.
// Baseado em admin-mobile.jsx HVAdminBanners.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminBanners } from "@/hooks/useAdminBanners";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const COLORS = ["#FF6B4A", "#1B6FB0", "#F2B544", "#2FB37A", "#7B2D9F", "#25C7E5"];

function PlusBtn({ label = "Novo" }: { label?: string }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
      style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
    >
      <HVIcon name="plus" size={14} stroke={2.6} />
      {label}
    </button>
  );
}

function dateRange(start: string | null, end: string | null): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `desde ${fmt(start)}`;
  if (end) return `até ${fmt(end)}`;
  return "sem prazo";
}

export default function AdminBanners() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data, isLoading } = useAdminBanners(tenantId);
  const [tab, setTab] = useState<"banners" | "avisos">("banners");

  const items =
    tab === "banners"
      ? (data?.banners ?? []).map((b) => ({
          id: b.id,
          title: b.title,
          range: dateRange(b.starts_at, b.ends_at),
          active: b.active,
        }))
      : (data?.announcements ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          range: dateRange(a.starts_at, a.ends_at),
          active: a.active,
        }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Banners & avisos" sub="GERENCIAR COMUNICAÇÃO" action={<PlusBtn />} />
      <div className="flex gap-4 px-4 pt-2.5 pb-1.5 bg-hv-surface border-b border-hv-line">
        {(["banners", "avisos"] as const).map((t) => (
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
            {t === "banners" ? "Banners" : "Avisos"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : items.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nada por aqui ainda.
          </div>
        ) : (
          items.map((b, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div
                key={b.id}
                className="hv-card mb-2.5 overflow-hidden p-0"
                style={{ opacity: b.active ? 1 : 0.55 }}
              >
                <div
                  className="h-[70px]"
                  style={{ background: `linear-gradient(135deg, ${c}, #061826)` }}
                >
                  <svg
                    viewBox="0 0 360 70"
                    className="w-full h-full opacity-50"
                    preserveAspectRatio="none"
                  >
                    <path d="M0 50 Q90 30 180 50 T360 50 L360 70 L0 70Z" fill="white" />
                  </svg>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate">{b.title}</div>
                    <div
                      className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {b.range}
                    </div>
                  </div>
                  <div
                    className="w-[38px] h-[22px] rounded-[11px] p-0.5 shrink-0"
                    style={{
                      background: b.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-[9px] bg-white"
                      style={{
                        transform: b.active ? "translateX(16px)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
