// UpdateBanner — surge quando o vite-plugin-pwa detecta nova versão do SW.
// Usa useRegisterSW de virtual:pwa-register/react (precisa do plugin configurado).

import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/Button";
import { clearSWAndCaches } from "@/hooks/useForceUpdate";

export function UpdateBanner() {
  const [hardResetting, setHardResetting] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        console.log("[UpdateBanner] SW registered:", registration.scope);
      }
    },
    onRegisterError(error) {
      console.error("[UpdateBanner] SW registration error:", error);
    },
  });

  if (!needRefresh) return null;

  const handleUpdate = async () => {
    await updateServiceWorker(true);
  };

  const handleHardReset = async () => {
    setHardResetting(true);
    await clearSWAndCaches();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4">
      <div className="shadow-lg" style={{ background: "hsl(var(--hv-navy))", color: "white" }}>
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-semibold truncate">Nova versão disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              onClick={handleUpdate}
              disabled={hardResetting}
            >
              Atualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHardReset}
              disabled={hardResetting}
              className="text-white hover:bg-white/10"
            >
              Resetar
            </Button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              aria-label="Fechar"
              className="p-1 rounded-md hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
