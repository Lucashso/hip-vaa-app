// Chips — barra horizontal de filtros para telas admin.
// Baseado no helper Chips do design admin-mobile.jsx.

import { cn } from "@/lib/utils";

export interface ChipItem {
  l: string;
  on?: boolean;
  onClick?: () => void;
}

interface ChipsProps {
  items: ChipItem[];
}

export function Chips({ items }: ChipsProps) {
  return (
    <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto bg-hv-surface">
      {items.map((c, i) => (
        <button
          key={`${c.l}-${i}`}
          type="button"
          onClick={c.onClick}
          className={cn(
            "hv-chip whitespace-nowrap",
            c.on
              ? "!bg-hv-navy !text-white"
              : "!bg-hv-surface border border-hv-line !text-hv-text-2",
          )}
        >
          {c.l}
        </button>
      ))}
    </div>
  );
}
