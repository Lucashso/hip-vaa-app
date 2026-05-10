import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-hv-navy" />
    </div>
  );
}
