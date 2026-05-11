// useForceUpdate — força reload do app quando o BUILD_ID muda no servidor.
// Combina: (a) realtime no platform_settings.min_app_version, (b) polling em /version.json.

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const APP_LOAD_TIME = new Date().toISOString();
const VERSION_URL = "/version.json";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min

let cachedBuildId: string | null = null;

/**
 * Helper standalone — limpa todos os service workers + caches e dá reload.
 */
export async function clearSWAndCaches(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.error("[clearSWAndCaches] error:", err);
  } finally {
    window.location.reload();
  }
}

async function fetchBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { build_id?: string; buildId?: string };
    return json.build_id ?? json.buildId ?? null;
  } catch {
    return null;
  }
}

export function useForceUpdate() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function triggerReload(reason: string) {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      console.log(`[useForceUpdate] trigger reload (${reason})`);
      await clearSWAndCaches();
    }

    // --- Polling /version.json ---
    async function pollVersion() {
      if (!mounted) return;
      const buildId = await fetchBuildId();
      if (!buildId) return;
      if (cachedBuildId === null) {
        cachedBuildId = buildId;
        return;
      }
      if (buildId !== cachedBuildId) {
        await triggerReload(`build_id ${cachedBuildId} -> ${buildId}`);
      }
    }
    void pollVersion();
    pollTimer = setInterval(pollVersion, POLL_INTERVAL_MS);

    // --- Realtime no platform_settings ---
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session) return;
      channel = supabase
        .channel("hipvaa-force-update")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "platform_settings",
            filter: "key=eq.min_app_version",
          },
          async (payload: { new: { value: unknown } }) => {
            const remoteValue = String(payload.new?.value ?? "");
            const remoteTime = Date.parse(remoteValue);
            const localTime = Date.parse(APP_LOAD_TIME);
            if (
              !Number.isNaN(remoteTime) &&
              !Number.isNaN(localTime) &&
              remoteTime > localTime
            ) {
              await triggerReload(`platform_settings.min_app_version ${remoteValue}`);
            }
          },
        )
        .subscribe();
    });

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);
}
