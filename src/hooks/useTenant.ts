// useTenant — info da filial do usuário + settings tipados + feature flags + mutations.
// Estendido pra suportar TenantSettings completo (40+ campos) com defaults.
// Workaround: hipvaa não tem coluna feature_flags dedicada, então usa settings_json.feature_flags.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "@/lib/businessTemplates";

// ---------- Types ----------

export interface TenantTheme {
  /** HSL triplet string, ex.: "215 50% 12%" (sem hsl()) */
  primary?: string;
  secondary?: string;
  accent?: string;
}

export type FreeCheckinPeriod = "daily" | "weekly" | "monthly";
export type ReplacementPeriod = "calendar" | "billing_cycle";
export type CheckinDayMode = "dynamic" | "multi_day" | "today_only";
export type ProrateBillingMode = "calendar" | "billing_cycle";

/**
 * Configurações da filial (tenants.settings_json).
 * 40+ campos com defaults aplicados em getDefaultSettings().
 */
export interface TenantSettings {
  // ---- Check-in / aulas ----
  checkin_opens_hours_before: number;
  checkin_closes_hours_before: number;
  cancel_hours_before: number;
  checkin_ranking_enabled: boolean;
  free_checkin_period: FreeCheckinPeriod;
  checkin_day_mode: CheckinDayMode;

  // ---- Geofencing ----
  geofencing_enabled: boolean;
  default_geofence_radius_m: number;

  // ---- Inadimplência ----
  delinquency_tolerance_days: number;

  // ---- Lembretes / push ----
  auto_reminders_enabled: boolean;
  push_notifications_enabled: boolean;
  class_reminder_hours: number;
  invoice_reminder_enabled: boolean;
  invoice_reminder_hour: number;
  checkin_open_notification_enabled: boolean;
  checkin_open_hour: number;
  checkin_closing_notification_enabled: boolean;
  checkin_closing_minutes_before: number;
  announcement_push_enabled: boolean;

  // ---- Comunidade ----
  community_post_expiry_days: number; // 0 = nunca expira
  community_moderation_enabled: boolean;

  // ---- Drop-in / aula avulsa ----
  drop_in_scheduling_enabled: boolean;
  drop_in_scheduling_days_ahead: number; // 2, 7, 15 ou 30

  // ---- Loja ----
  shop_enabled: boolean;

  // ---- Cobrança / faturamento ----
  prorate_upgrade_enabled: boolean;
  prorate_billing_mode: ProrateBillingMode;

  // ---- Reposição de aula ----
  class_replacement_enabled: boolean;
  replacement_period: ReplacementPeriod;

  // ---- Aniversários ----
  birthdays_public: boolean;

  // ---- Tema (workaround sem coluna theme_json) ----
  theme: TenantTheme | null;

  // ---- Feature flags (workaround sem coluna feature_flags) ----
  feature_flags: FeatureFlags;

  // ---- Business template ----
  business_template: string;

  // Permite leitura/escrita de chaves ainda não tipadas em settings_json
  [key: string]: unknown;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  domain: string | null;
  active: boolean;
  partnership_whatsapp: string | null;
  drop_in_price_cents: number | null;
  contract_text: string | null;
  drop_in_contract_text: string | null;
  settings_json: Record<string, unknown> | null;
}

// ---------- Defaults ----------

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  // Check-in
  checkin_opens_hours_before: 24,
  checkin_closes_hours_before: 12,
  cancel_hours_before: 12,
  checkin_ranking_enabled: true,
  free_checkin_period: "daily",
  checkin_day_mode: "dynamic",

  // Geofencing
  geofencing_enabled: false,
  default_geofence_radius_m: 100,

  // Inadimplência
  delinquency_tolerance_days: 1,

  // Lembretes / push
  auto_reminders_enabled: true,
  push_notifications_enabled: true,
  class_reminder_hours: 2,
  invoice_reminder_enabled: true,
  invoice_reminder_hour: 10,
  checkin_open_notification_enabled: true,
  checkin_open_hour: 8,
  checkin_closing_notification_enabled: true,
  checkin_closing_minutes_before: 30,
  announcement_push_enabled: true,

  // Comunidade
  community_post_expiry_days: 5,
  community_moderation_enabled: true,

  // Drop-in
  drop_in_scheduling_enabled: false,
  drop_in_scheduling_days_ahead: 7,

  // Loja
  shop_enabled: false,

  // Cobrança
  prorate_upgrade_enabled: false,
  prorate_billing_mode: "calendar",

  // Reposição
  class_replacement_enabled: false,
  replacement_period: "calendar",

  // Aniversários
  birthdays_public: false,

  // Tema
  theme: null,

  // Feature flags
  feature_flags: DEFAULT_FEATURE_FLAGS,

  // Business template default
  business_template: "rowing",
};

// ---------- Helpers ----------

function mergeSettings(raw: Record<string, unknown> | null | undefined): TenantSettings {
  const r = raw ?? {};

  // Feature flags merge profundo
  const rawFlags = (r.feature_flags as Partial<FeatureFlags> | undefined) ?? {};
  const feature_flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ...rawFlags };

  // Tema preserva null (não força default — ThemeProvider decide)
  const themeValue = r.theme as TenantTheme | null | undefined;
  const theme = themeValue ?? null;

  return {
    ...DEFAULT_TENANT_SETTINGS,
    ...r,
    feature_flags,
    theme,
  } as TenantSettings;
}

// ---------- Query principal ----------

/**
 * useTenant — retorna a filial atual + settings com defaults + feature flags.
 *
 * Mantém compat:
 *   const { data: tenant, isLoading } = useTenant();
 *   tenant?.name
 *
 * Adições:
 *   const { settings, featureFlags, updateTenant, updateSettings, updateFeatureFlags } = useTenant();
 */
export function useTenant() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["tenant", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!profile?.tenant_id,
  });

  const settings: TenantSettings = mergeSettings(
    (query.data?.settings_json as Record<string, unknown> | null) ?? null,
  );
  const featureFlags: FeatureFlags = settings.feature_flags;

  // ---- Mutations ----

  const updateTenant = useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          Tenant,
          | "name"
          | "slug"
          | "domain"
          | "active"
          | "partnership_whatsapp"
          | "drop_in_price_cents"
          | "contract_text"
          | "drop_in_contract_text"
          | "settings_json"
        >
      >,
    ) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const { error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
    onError: (err: Error) => {
      console.error("Erro ao atualizar tenant:", err);
      toast.error("Erro ao salvar alterações");
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (patch: Partial<TenantSettings> | Record<string, unknown>) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const { data: current, error: fetchErr } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", profile.tenant_id)
        .single();
      if (fetchErr) throw fetchErr;
      const merged = {
        ...((current?.settings_json as Record<string, unknown> | null) ?? {}),
        ...patch,
      };
      const { error } = await supabase
        .from("tenants")
        .update({ settings_json: merged })
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });

  const updateFeatureFlags = useMutation({
    mutationFn: async (patch: Partial<FeatureFlags>) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const { data: current, error: fetchErr } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", profile.tenant_id)
        .single();
      if (fetchErr) throw fetchErr;
      const currentSettings =
        (current?.settings_json as Record<string, unknown> | null) ?? {};
      const currentFlags =
        (currentSettings.feature_flags as Partial<FeatureFlags> | undefined) ?? {};
      const mergedFlags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        ...currentFlags,
        ...patch,
      };
      const merged = {
        ...currentSettings,
        feature_flags: mergedFlags,
      };
      const { error } = await supabase
        .from("tenants")
        .update({ settings_json: merged })
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
    onError: (err: Error) =>
      toast.error("Erro ao salvar feature flags: " + err.message),
  });

  return {
    // Compat com chamadas existentes
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Novos campos derivados
    settings,
    featureFlags,

    // Mutations
    updateTenant,
    updateSettings,
    updateFeatureFlags,
  };
}

// ---------- Mutations standalone (compat) ----------

export function useUpdateTenantContracts() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async ({
      contract_text,
      drop_in_contract_text,
    }: {
      contract_text?: string;
      drop_in_contract_text?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const payload: Record<string, string> = {};
      if (contract_text !== undefined) payload.contract_text = contract_text;
      if (drop_in_contract_text !== undefined)
        payload.drop_in_contract_text = drop_in_contract_text;
      const { error } = await supabase
        .from("tenants")
        .update(payload)
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Termos atualizados!");
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });
}

export function useUpdateTenantSettings() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
      const { data: current, error: fetchErr } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", profile.tenant_id)
        .single();
      if (fetchErr) throw fetchErr;
      const merged = {
        ...((current?.settings_json as Record<string, unknown> | null) ?? {}),
        ...patch,
      };
      const { error } = await supabase
        .from("tenants")
        .update({ settings_json: merged })
        .eq("id", profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });
}
