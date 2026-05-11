// PushNotificationToggle — switch UI usado em Settings do aluno.
// Lê estado de usePushNotifications.isSubscribed e chama subscribe/unsubscribe.

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Share, Settings, Lock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-40"
      style={{
        background: checked ? "hsl(var(--hv-navy))" : "hsl(var(--hv-line))",
      }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, loading, permission, subscribe, unsubscribe } = usePushNotifications();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOSNonPWA, setIsIOSNonPWA] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsIOS(iOS);
    setIsAndroid(android);
    setIsIOSNonPWA(iOS && !standalone);
  }, []);

  // iOS não-PWA: precisa instalar primeiro
  if (isIOSNonPWA) {
    return (
      <div className="hv-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <BellOff className="h-4 w-4" style={{ color: "hsl(var(--hv-amber))" }} />
          <h3 className="font-display text-[15px] font-bold text-hv-text">Instale o App Primeiro</h3>
        </div>
        <p className="text-sm text-hv-text-2 mb-3">
          No iPhone/iPad, as notificações só funcionam quando o app está instalado na tela inicial.
        </p>
        <ol className="text-sm text-hv-text-2 space-y-2">
          <li className="flex items-start gap-2">
            <span
              className="rounded-full w-5 h-5 grid place-items-center text-xs font-bold flex-shrink-0"
              style={{ background: "hsl(var(--hv-cyan) / 0.15)", color: "hsl(var(--hv-navy))" }}
            >
              1
            </span>
            <span>
              Toque em <Share className="h-3.5 w-3.5 inline mx-1" /> (Compartilhar) na barra do Safari
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="rounded-full w-5 h-5 grid place-items-center text-xs font-bold flex-shrink-0"
              style={{ background: "hsl(var(--hv-cyan) / 0.15)", color: "hsl(var(--hv-navy))" }}
            >
              2
            </span>
            <span>
              Role e toque em <strong>"Adicionar à Tela de Início"</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="rounded-full w-5 h-5 grid place-items-center text-xs font-bold flex-shrink-0"
              style={{ background: "hsl(var(--hv-cyan) / 0.15)", color: "hsl(var(--hv-navy))" }}
            >
              3
            </span>
            <span>Abra o app pela tela inicial e volte aqui</span>
          </li>
        </ol>
      </div>
    );
  }

  // Sem suporte (navegador antigo)
  if (!isSupported) {
    return (
      <div className="hv-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <BellOff className="h-4 w-4 text-hv-text-2" />
          <h3 className="font-display text-[15px] font-bold text-hv-text">Notificações Push</h3>
        </div>
        <p className="text-sm text-hv-text-2">
          Seu navegador não suporta notificações push. Tente Chrome, Safari ou Edge atualizado.
        </p>
      </div>
    );
  }

  // Permissão bloqueada
  if (permission === "denied") {
    return (
      <div
        className="hv-card p-4"
        style={{ background: "hsl(var(--hv-coral) / 0.08)", borderColor: "hsl(var(--hv-coral) / 0.25)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BellOff className="h-4 w-4" style={{ color: "hsl(var(--hv-coral))" }} />
          <h3 className="font-display text-[15px] font-bold text-hv-text">Notificações Bloqueadas</h3>
        </div>
        <p className="text-sm text-hv-text-2 mb-3">
          Você bloqueou as notificações anteriormente. Para ativar, siga as instruções:
        </p>
        <div className="space-y-2 text-sm text-hv-text-2">
          {isIOS && (
            <div className="flex items-start gap-2">
              <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-hv-text">iPhone/iPad:</p>
                <p>Ajustes → Hip Va'a → Notificações → Permitir</p>
              </div>
            </div>
          )}
          {isAndroid && (
            <div className="flex items-start gap-2">
              <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-hv-text">Android:</p>
                <p>Configurações → Apps → Hip Va'a → Notificações → Ativar</p>
              </div>
            </div>
          )}
          {!isIOS && !isAndroid && (
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-hv-text">No navegador:</p>
                <p>Clique no cadeado da barra → Permissões → Notificações → Permitir</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleToggle = async (next: boolean) => {
    if (next) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="hv-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4" style={{ color: "hsl(var(--hv-navy))" }} />
        <h3 className="font-display text-[15px] font-bold text-hv-text">Notificações Push</h3>
      </div>
      <p className="text-sm text-hv-text-2 mb-3">Receba avisos sobre aulas, pagamentos e tripulações.</p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-hv-text">
          {isSubscribed ? "Notificações ativadas" : "Ativar notificações"}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-hv-text-2" />
        ) : (
          <Toggle checked={isSubscribed} onChange={handleToggle} disabled={loading} />
        )}
      </div>

      {!isSubscribed && permission === "default" && (
        <div
          className="text-xs text-hv-text-2 mt-3 pt-3 space-y-1"
          style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
        >
          <p className="font-semibold text-hv-text">Como ativar:</p>
          {isIOS && <p>Ative o toggle acima e toque em "Permitir" quando solicitado.</p>}
          {isAndroid && <p>Ative o toggle acima e toque em "Permitir" na janela que aparecer.</p>}
          {!isIOS && !isAndroid && <p>Ative o toggle e clique em "Permitir" no popup do navegador.</p>}
        </div>
      )}
    </div>
  );
}
