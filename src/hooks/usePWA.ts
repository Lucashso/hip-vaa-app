// usePWA — captura beforeinstallprompt, detecta iOS Safari, expõe install() e dismiss.
// Espelha lemehubapp adaptado pra namespace hipvaa.

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const INSTALL_DISMISSED_KEY = "hipvaa_install_dismissed_at";
const DISMISS_DURATION_DAYS = 7;

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  // Verifica se já foi dispensado recentemente
  useEffect(() => {
    const dismissedAt = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!dismissedAt) return;
    const dismissedDate = new Date(dismissedAt);
    if (Number.isNaN(dismissedDate.getTime())) {
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
      return;
    }
    const diffDays =
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < DISMISS_DURATION_DAYS) {
      setDismissed(true);
    } else {
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
    }
  }, []);

  // Detecta iOS Safari (não recebe beforeinstallprompt)
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    // Safari iOS: tem "Safari" mas não "CriOS" (Chrome iOS), "FxiOS" (Firefox iOS), "EdgiOS" (Edge iOS).
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    setIsIOSSafari(isIOSDevice && isSafari);
  }, []);

  // Detecta se já está instalado (standalone)
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);
  }, []);

  // Captura evento beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Detecta instalação concluída
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => {
      window.removeEventListener("appinstalled", handler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
    } catch (error) {
      console.error("[usePWA] install error:", error);
    }
    return false;
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
  }, []);

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    isIOSSafari,
    dismissed,
    install,
    dismissInstall,
  };
}
