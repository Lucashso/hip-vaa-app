// FilialConfig — configurações da filial (admin).
// Adaptado do HVFilialConfig (equipe-extras.jsx).

import { useState } from "react";
import { toast } from "sonner";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon, HVLogo } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useUpdateTenant } from "@/hooks/useAlunos";
import { cn } from "@/lib/utils";
import { NfseConfigTab } from "@/components/Admin/NfseConfigTab";

interface ToggleSetting {
  key: string;
  label: string;
  description?: string;
}

const TOGGLE_KEYS: ToggleSetting[] = [
  { key: "checkin_multi_day", label: "Modo multi-dia" },
  { key: "auto_confirm_waitlist", label: "Auto-confirmar lista de espera" },
];

const PALETTE_DEFAULT = ["#0E3A5F", "#1B6FB0", "#25C7E5"];

type ConfigTab = "geral" | "nfse";

export default function FilialConfig() {
  const { profile } = useAuth();
  const { data: tenant } = useTenant();
  const tenantId = profile?.tenant_id;
  const update = useUpdateTenant(tenantId);
  const [activeTab, setActiveTab] = useState<ConfigTab>("geral");

  // Lê toggles do settings_json, com fallback default
  const settings = (tenant?.settings_json ?? {}) as Record<string, unknown>;
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({
    checkin_multi_day: Boolean(settings.checkin_multi_day ?? true),
    auto_confirm_waitlist: Boolean(settings.auto_confirm_waitlist ?? true),
  });

  function toggleSetting(key: string) {
    const next = !localToggles[key];
    setLocalToggles((prev) => ({ ...prev, [key]: next }));
    if (!tenantId) return;
    const newSettings = { ...settings, [key]: next };
    update.mutate(
      { settings_json: newSettings },
      {
        onError: () => {
          setLocalToggles((prev) => ({ ...prev, [key]: !next }));
          toast.error("Não foi possível salvar a configuração.");
        },
        onSuccess: () => toast.success("Configuração atualizada."),
      },
    );
  }

  const tenantName = tenant?.name || "Filial";
  const tenantUpper = tenantName.toUpperCase();
  const tenantSlug = tenant?.slug || "filial";
  const linkPublic = `hipvaa.app/${tenantSlug}/cadastro`;
  // Campos extras presentes na tabela mas fora do tipo Tenant tipado
  const tenantExtras = (tenant ?? {}) as Record<string, string | null | undefined>;
  const businessName = tenantExtras.business_name;
  const businessEmail = tenantExtras.business_email;

  const checkinWindowOpens = (settings.checkin_opens_hours_before as number) ?? 24;
  const checkinWindowCloses = (settings.checkin_closes_hours_before as number) ?? 0;
  const tolerance = (settings.tolerance_min as number) ?? 5;
  const reposicao = (settings.monthly_makeup_limit as number) ?? 2;

  return (
    <PageScaffold
      eyebrow={`${tenantUpper} · ADMIN`}
      title="Configurações"
      back
      showTabBar={false}
    >
      {/* Tabs */}
      <div className="flex gap-4 pb-2 border-b border-hv-line mb-3">
        {(["geral", "nfse"] as ConfigTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={cn(
              "py-1.5 text-[13px] bg-transparent border-0",
              activeTab === t ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom: activeTab === t ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t === "geral" ? "Geral" : "NFs-e"}
          </button>
        ))}
      </div>

      {/* NFs-e Tab */}
      {activeTab === "nfse" && <NfseConfigTab tenantId={tenantId} />}

      {/* Geral Tab */}
      {activeTab === "geral" && <>
      {/* identidade */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
        Identidade da filial
      </h3>
      <div className="hv-card" style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div
            className="grid place-items-center text-white"
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "hsl(var(--hv-navy))",
            }}
          >
            <HVLogo size={36} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">Hip Va'a · {tenantName}</div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              {businessName || "Sem razão social"}
            </div>
          </div>
          <button
            type="button"
            className="px-2.5 py-2 rounded-md text-[11px] font-semibold text-hv-text"
            style={{
              background: "hsl(var(--hv-bg))",
              border: "1px solid hsl(var(--hv-line))",
            }}
          >
            Trocar logo
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {PALETTE_DEFAULT.map((c, i) => (
            <div
              key={c}
              className="rounded-[10px]"
              style={{
                height: 36,
                background: c,
                border:
                  i === 2 ? "2px solid hsl(var(--hv-text))" : "1px solid hsl(var(--hv-line))",
              }}
            />
          ))}
        </div>
        <div className="hv-mono text-[10px] text-hv-text-3 mt-1.5 tracking-[0.04em]">
          PALETA DA FILIAL · CICLO OCEANO
        </div>
      </div>

      {/* regras */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
        Regras de check-in
      </h3>
      <div className="hv-card overflow-hidden">
        {[
          {
            l: "Janela de check-in",
            v: `−${checkinWindowOpens}h / +${checkinWindowCloses}min`,
            chev: true,
          },
          { l: "Tolerância de atraso", v: `${tolerance} min`, chev: true },
          { l: "Reposição mensal", v: `até ${reposicao} aulas`, chev: true },
          ...TOGGLE_KEYS.map((t) => ({
            l: t.label,
            v: "",
            chev: false,
            toggleKey: t.key,
            on: localToggles[t.key],
          })),
        ].map((r, i, arr) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-3",
              i < arr.length - 1 && "border-b border-hv-line",
            )}
          >
            <div className="flex-1">
              <div className="text-[13px] font-semibold">{r.l}</div>
              {r.v && !("toggleKey" in r) && (
                <div className="text-[11px] text-hv-text-3 mt-0.5">{r.v}</div>
              )}
            </div>
            {"toggleKey" in r ? (
              <button
                type="button"
                onClick={() => toggleSetting(r.toggleKey as string)}
                className="relative shrink-0"
                style={{
                  width: 38,
                  height: 22,
                  borderRadius: 11,
                  background: r.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                  padding: 2,
                  transition: "background .2s",
                }}
              >
                <div
                  className="bg-white"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transform: r.on ? "translateX(16px)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            ) : (
              <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
            )}
          </div>
        ))}
      </div>

      {/* pagamento */}
      <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
        Pagamento & integrações
      </h3>
      <div className="hv-card overflow-hidden">
        {[
          { l: "Gateway", v: "Asaas conectado", icon: "credit" as const, c: "hsl(var(--hv-leaf))" },
          {
            l: "Chave Pix",
            v: businessEmail || "—",
            icon: "qr" as const,
            c: "hsl(var(--hv-navy))",
          },
          { l: "NFs-e", v: "Prefeitura · pendente", icon: "wallet" as const, c: "hsl(var(--hv-amber))" },
          {
            l: "WhatsApp Business",
            v: tenant?.partnership_whatsapp || "desconectado",
            icon: "share" as const,
            c: tenant?.partnership_whatsapp ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
          },
          { l: "Strava clube", v: "desconectado", icon: "zap" as const, c: "hsl(var(--hv-text-3))" },
        ].map((it, i, arr) => (
          <div
            key={it.l}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3",
              i < arr.length - 1 && "border-b border-hv-line",
            )}
          >
            <div
              className="grid place-items-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "hsl(var(--hv-bg))",
                color: it.c,
              }}
            >
              <HVIcon name={it.icon} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">{it.l}</div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: it.c }}>
                {it.v}
              </div>
            </div>
            <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
          </div>
        ))}
      </div>

      {/* link público */}
      <div
        className="hv-card"
        style={{
          padding: 14,
          background: "hsl(var(--hv-foam))",
          border: "1px solid rgba(37,199,229,0.3)",
        }}
      >
        <div className="hv-mono text-[10px] text-hv-navy tracking-[0.14em] font-bold">
          LINK PÚBLICO DE CADASTRO
        </div>
        <div
          className="mt-2 px-3 py-2.5 rounded-[10px] flex items-center gap-2 bg-white"
          style={{ border: "1px dashed hsl(var(--hv-cyan))" }}
        >
          <span className="hv-mono flex-1 text-[11px] text-hv-navy overflow-hidden text-ellipsis whitespace-nowrap">
            {linkPublic}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                .writeText(`https://${linkPublic}`)
                .then(() => toast.success("Link copiado"))
                .catch(() => toast.error("Não foi possível copiar"));
            }}
            className="bg-hv-navy text-white rounded-md px-2 py-1.5 inline-flex gap-1 items-center text-[11px] font-semibold"
          >
            <HVIcon name="copy" size={12} />
            Copiar
          </button>
        </div>
      </div>
      </>}
    </PageScaffold>
  );
}
