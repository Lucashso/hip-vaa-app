// usePushDiagnostics — checa estado de cada etapa do push e devolve lista de checks.
// Útil pra tela de debug em Settings.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export type CheckStatus = "ok" | "warn" | "fail" | "unknown";

export interface PushCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "") as string;

export function usePushDiagnostics() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<PushCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    const result: PushCheck[] = [];

    // 1. Service Worker registered
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        result.push({
          id: "sw",
          label: "Service Worker registrado",
          status: reg ? "ok" : "fail",
          detail: reg ? reg.scope : "Nenhum SW registrado",
        });
      } catch (err) {
        result.push({
          id: "sw",
          label: "Service Worker registrado",
          status: "fail",
          detail: err instanceof Error ? err.message : "erro desconhecido",
        });
      }
    } else {
      result.push({
        id: "sw",
        label: "Service Worker registrado",
        status: "fail",
        detail: "navigator.serviceWorker indisponível",
      });
    }

    // 2. PushManager available
    result.push({
      id: "pushmanager",
      label: "PushManager disponível",
      status: "PushManager" in window ? "ok" : "fail",
      detail: "PushManager" in window ? undefined : "PushManager indisponível",
    });

    // 3. Notification permission
    if ("Notification" in window) {
      const perm = Notification.permission;
      result.push({
        id: "permission",
        label: "Permissão de notificações",
        status: perm === "granted" ? "ok" : perm === "denied" ? "fail" : "warn",
        detail: perm,
      });
    } else {
      result.push({
        id: "permission",
        label: "Permissão de notificações",
        status: "fail",
        detail: "API Notification indisponível",
      });
    }

    // 4. VAPID key configurada
    result.push({
      id: "vapid",
      label: "VAPID public key configurada",
      status: VAPID_PUBLIC_KEY ? "ok" : "fail",
      detail: VAPID_PUBLIC_KEY
        ? `${VAPID_PUBLIC_KEY.slice(0, 12)}…`
        : "VITE_VAPID_PUBLIC_KEY vazia",
    });

    // 5. Subscription no navegador
    let endpointInBrowser: string | null = null;
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        endpointInBrowser = sub?.endpoint ?? null;
        result.push({
          id: "browser_subscription",
          label: "Subscription ativa no navegador",
          status: sub ? "ok" : "warn",
          detail: sub ? `endpoint ${sub.endpoint.slice(0, 50)}…` : "nenhuma",
        });
      } else {
        result.push({
          id: "browser_subscription",
          label: "Subscription ativa no navegador",
          status: "fail",
        });
      }
    } catch (err) {
      result.push({
        id: "browser_subscription",
        label: "Subscription ativa no navegador",
        status: "fail",
        detail: err instanceof Error ? err.message : "erro",
      });
    }

    // 6. Subscription salva no Supabase
    if (user) {
      try {
        const query = supabase
          .from("push_subscriptions")
          .select("id, endpoint")
          .eq("user_id", user.id);
        const { data, error } = await query;
        if (error) {
          result.push({
            id: "db_subscription",
            label: "Subscription salva no Supabase",
            status: "fail",
            detail: error.message,
          });
        } else {
          const rows = data ?? [];
          const matchesBrowser =
            endpointInBrowser !== null &&
            rows.some((r) => r.endpoint === endpointInBrowser);
          if (rows.length === 0) {
            result.push({
              id: "db_subscription",
              label: "Subscription salva no Supabase",
              status: "warn",
              detail: "nenhuma row pra este user",
            });
          } else if (endpointInBrowser && !matchesBrowser) {
            result.push({
              id: "db_subscription",
              label: "Subscription salva no Supabase",
              status: "warn",
              detail: `${rows.length} row(s) mas endpoint do navegador não bate`,
            });
          } else {
            result.push({
              id: "db_subscription",
              label: "Subscription salva no Supabase",
              status: "ok",
              detail: `${rows.length} row(s)`,
            });
          }
        }
      } catch (err) {
        result.push({
          id: "db_subscription",
          label: "Subscription salva no Supabase",
          status: "fail",
          detail: err instanceof Error ? err.message : "erro",
        });
      }
    } else {
      result.push({
        id: "db_subscription",
        label: "Subscription salva no Supabase",
        status: "unknown",
        detail: "usuário não logado",
      });
    }

    setChecks(result);
    setLoading(false);
    return result;
  }, [user]);

  useEffect(() => {
    void run();
  }, [run]);

  return { checks, loading, run };
}
