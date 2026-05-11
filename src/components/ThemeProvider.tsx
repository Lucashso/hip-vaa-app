// ThemeProvider — aplica tema customizado por tenant via CSS variables.
//
// Lê `useTenant().settings.theme` (shape: `{ primary?, secondary?, accent? }`,
// onde cada valor é uma string HSL ex.: "215 50% 12%" sem hsl()).
// Aplica em:
//   primary   -> --hv-navy
//   secondary -> --hv-blue
//   accent    -> --hv-cyan
// Quando o tenant ainda não carregou ou não define theme, mantém o default
// oceânico de index.css (não sobrescreve).

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTenant } from "@/hooks/useTenant";

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const { settings } = useTenant();
  const theme = settings.theme;

  const primary = theme?.primary;
  const secondary = theme?.secondary;
  const accent = theme?.accent;

  useEffect(() => {
    if (!theme) return; // mantém defaults do index.css
    const root = document.documentElement;
    if (primary) root.style.setProperty("--hv-navy", primary);
    if (secondary) root.style.setProperty("--hv-blue", secondary);
    if (accent) root.style.setProperty("--hv-cyan", accent);
  }, [theme, primary, secondary, accent]);

  return <>{children}</>;
}

export default ThemeProvider;
