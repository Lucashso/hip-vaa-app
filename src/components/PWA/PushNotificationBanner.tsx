// PushNotificationBanner — convida o usuário logado a ativar push notifications.
// Só aparece se: logged in + PWA instalado + suportado + !subscribed + permission default.

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/Button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "hipvaa_push_banner_dismissed_at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function PushNotificationBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const at = localStorage.getItem(DISMISS_KEY);
    if (at) {
      const elapsed = Date.now() - Number.parseInt(at, 10);
      if (Number.isFinite(elapsed) && elapsed < DISMISS_DURATION_MS) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) setDismissed(true);
  };

  if (
    !user ||
    !isStandalone ||
    !isSupported ||
    isSubscribed ||
    permission === "denied" ||
    permission === "granted" ||
    dismissed ||
    loading
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4">
      <div className="hv-card mx-auto max-w-3xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full grid place-items-center"
            style={{ background: "hsl(var(--hv-cyan) / 0.15)", color: "hsl(var(--hv-navy))" }}
          >
            <Bell className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[15px] font-bold text-hv-text">
                Receba avisos no celular
              </h3>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Fechar"
                className="text-hv-text-2 hover:text-hv-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-hv-text-2 mt-1">
              Ative notificações pra saber de aulas, check-in e pagamentos.
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Não, obrigado
              </Button>
              <Button size="sm" onClick={handleSubscribe} disabled={loading}>
                Permitir notificações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
