// useFeatureFlags — feature flags do tenant atual (workaround em settings_json.feature_flags).

import { useTenant } from "./useTenant";
import type { FeatureFlags } from "@/lib/businessTemplates";

export function useFeatureFlags() {
  const { featureFlags, settings, isLoading } = useTenant();

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return featureFlags[flag] !== false;
  };

  return {
    flags: featureFlags,
    /** alias mantido pra paridade com lemehub */
    featureFlags,
    isEnabled,
    isLoading,
    businessTemplate: settings.business_template,
  };
}

/**
 * useIsFeatureEnabled — helper direto pra checar uma única flag.
 * Retorna `false` enquanto carrega ou se a flag estiver desabilitada.
 */
export function useIsFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const { featureFlags, isLoading } = useTenant();
  if (isLoading) return false;
  return featureFlags[flag] !== false;
}
