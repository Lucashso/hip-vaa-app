// usePushNotifications — gerencia push subscription do dispositivo.
// Pede permissão, subscribe via VAPID, persiste em push_subscriptions no Supabase.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";

// VAPID public key do env; sem fallback hardcoded — W2-A configura via .env.
const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "") as string;

// localStorage key para estado "ativado" rápido (otimização anti-flicker)
const ACTIVATED_KEY = "hipvaa_push_activated";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

function detectDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPod/.test(ua)) return "iPod";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh|Mac OS/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Web";
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Confere subscription atual — PushManager é fonte da verdade pra UX
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!isSupported) {
        setLoading(false);
        return;
      }

      const activatedLocal = localStorage.getItem(ACTIVATED_KEY) === "true";
      if (activatedLocal) {
        setIsSubscribed(true);
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (cancelled) return;

        if (sub) {
          setIsSubscribed(true);
          localStorage.setItem(ACTIVATED_KEY, "true");

          // Auto-heal: insere no banco se ainda não estiver lá
          if (user) {
            const json = sub.toJSON();
            if (json.keys?.p256dh && json.keys.auth) {
              const { data } = await supabase
                .from("push_subscriptions")
                .select("id")
                .eq("user_id", user.id)
                .eq("endpoint", sub.endpoint)
                .maybeSingle();

              if (!data) {
                await supabase
                  .from("push_subscriptions")
                  .upsert(
                    {
                      user_id: user.id,
                      tenant_id: tenant?.id ?? null,
                      endpoint: sub.endpoint,
                      p256dh: json.keys.p256dh,
                      auth: json.keys.auth,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id,endpoint" },
                  );
              }
            }
          }
        } else {
          setIsSubscribed(false);
          localStorage.removeItem(ACTIVATED_KEY);
        }
      } catch (err) {
        console.error("[usePushNotifications] check error:", err);
        if (!activatedLocal) setIsSubscribed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [isSupported, user, tenant]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      toast.error("Notificações push não suportadas");
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error("[usePushNotifications] VITE_VAPID_PUBLIC_KEY ausente");
      toast.error("Configuração de notificações incompleta");
      return false;
    }

    try {
      setLoading(true);

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Permissão de notificações negada");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys.auth) {
        throw new Error("Subscription sem keys válidas");
      }

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            tenant_id: tenant?.id ?? null,
            endpoint: sub.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" },
        );

      if (error) {
        // Não bloqueia UX: navegador já está inscrito, é só estado de DB
        console.error("[usePushNotifications] upsert error:", error);
      }

      localStorage.setItem(ACTIVATED_KEY, "true");
      // Guarda meta extra em localStorage (UA/device) pra eventual debug
      try {
        localStorage.setItem(
          "hipvaa_push_meta",
          JSON.stringify({
            user_agent: navigator.userAgent,
            device_label: detectDeviceLabel(),
            endpoint: sub.endpoint,
          }),
        );
      } catch {
        /* ignore quota errors */
      }

      setIsSubscribed(true);
      toast.success("Notificações ativadas!");
      return true;
    } catch (err) {
      console.error("[usePushNotifications] subscribe error:", err);
      toast.error("Erro ao ativar notificações");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, user, tenant]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      localStorage.removeItem(ACTIVATED_KEY);
      localStorage.removeItem("hipvaa_push_meta");
      setIsSubscribed(false);
      toast.success("Notificações desativadas");
      return true;
    } catch (err) {
      console.error("[usePushNotifications] unsubscribe error:", err);
      toast.error("Erro ao desativar notificações");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    loading,
    permission,
    subscribe,
    unsubscribe,
  };
}
