// InstallBanner — convida usuário a instalar o PWA.
// Renderiza só quando installable && !dismissed && !installed.
// Em iOS Safari, mostra instruções de "Adicionar à tela de início".

import { Download, Share, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/Button";

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOSSafari, dismissed, install, dismissInstall } = usePWA();

  // Mostra se podemos instalar via prompt OU se for iOS Safari (sem prompt nativo),
  // mas nunca se já estiver instalado ou se já foi dispensado.
  const show = !isInstalled && !dismissed && (isInstallable || isIOSSafari);
  if (!show) return null;

  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
      <div className="hv-card mx-auto max-w-3xl shadow-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-[10px] grid place-items-center"
            style={{ background: "hsl(var(--hv-cyan) / 0.15)", color: "hsl(var(--hv-navy))" }}
          >
            <Download className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[15px] font-bold text-hv-text">
              Instalar Hip Va'a no celular
            </h3>
            <p className="text-xs text-hv-text-2 mt-0.5">
              {isIOSSafari
                ? "No iPhone, toque em Compartilhar e depois \"Adicionar à Tela de Início\""
                : "Acesso rápido com um toque, sem abrir navegador."}
            </p>

            {isIOSSafari ? (
              <div
                className="mt-2 flex items-center gap-2 text-xs text-hv-text-2 rounded-[10px] px-2 py-2"
                style={{ background: "hsl(var(--hv-foam))" }}
              >
                <Share className="h-4 w-4 flex-shrink-0" />
                <span>
                  Toque em <Share className="h-3 w-3 inline mx-0.5" /> e selecione "Adicionar à Tela de Início"
                </span>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={dismissInstall} className="flex-1">
                  Agora não
                </Button>
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  Instalar
                </Button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Fechar"
            className="flex-shrink-0 p-1 rounded-md hover:bg-hv-foam text-hv-text-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
