// PageLoader — fallback dedicado pro Suspense em rotas lazy.
// Logo + spinner pequeno + texto "Carregando...".

import { Loader2 } from "lucide-react";
import { HVLogo } from "@/components/HVLogo";

export function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <HVLogo size={56} color="hsl(var(--hv-navy))" />
        <div className="flex items-center gap-2 text-hv-text-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-hv-navy" />
          <span>Carregando...</span>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
