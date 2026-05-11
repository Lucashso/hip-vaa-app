// BusinessTemplateSelector — grid de 5 cards pra escolher tipo de negócio do tenant.
// Usado em /assinar (passo 1 do signup público).

import { BUSINESS_TEMPLATES, type BusinessTemplate } from "@/lib/businessTemplates";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (template: BusinessTemplate) => void;
}

export function BusinessTemplateSelector({ value, onChange }: Props) {
  return (
    <div>
      <div className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px] mb-2">
        Tipo de negócio
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {BUSINESS_TEMPLATES.map((tmpl) => {
          const active = value === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onChange(tmpl)}
              className={cn(
                "text-left p-3 rounded-[14px] border-[1.5px] transition-all",
                active
                  ? "border-hv-navy bg-hv-foam"
                  : "border-hv-line bg-hv-surface hover:border-hv-navy/40",
              )}
            >
              <div className="text-[24px] leading-none mb-1.5">{tmpl.icon}</div>
              <div
                className={cn(
                  "font-display text-[14px] font-bold leading-tight",
                  active ? "text-hv-navy" : "text-hv-text",
                )}
              >
                {tmpl.name}
              </div>
              <div className="text-[11px] text-hv-text-2 mt-1 leading-snug">
                {tmpl.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
