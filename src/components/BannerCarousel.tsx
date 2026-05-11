// BannerCarousel — carrossel horizontal de banners do tenant.
// Implementação simples com scroll snap + paginação por dots.

import { useEffect, useRef, useState } from "react";
import type { StudentBanner } from "@/hooks/useStudentBanners";
import { cn } from "@/lib/utils";

interface Props {
  banners: StudentBanner[];
  onClick?: (banner: StudentBanner) => void;
  autoplayMs?: number;
}

export function BannerCarousel({ banners, onClick, autoplayMs = 5000 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      const next = (index + 1) % banners.length;
      setIndex(next);
      const el = ref.current;
      if (el) {
        const w = el.clientWidth;
        el.scrollTo({ left: next * w, behavior: "smooth" });
      }
    }, autoplayMs);
    return () => clearInterval(t);
  }, [index, banners.length, autoplayMs]);

  // Sync index com scroll manual
  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    if (!w) return;
    const i = Math.round(el.scrollLeft / w);
    if (i !== index) setIndex(i);
  }

  if (banners.length === 0) return null;

  return (
    <div className="-mx-1 px-1">
      <div
        ref={ref}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {banners.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onClick?.(b)}
            className="snap-center shrink-0 w-full rounded-[18px] overflow-hidden relative text-left active:scale-[0.98] transition-transform"
            style={{
              aspectRatio: "16/9",
              background:
                "linear-gradient(135deg, hsl(var(--hv-navy)) 0%, hsl(var(--hv-blue)) 100%)",
            }}
          >
            {b.image_url ? (
              <img
                src={b.image_url}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)",
              }}
            />
            <div className="absolute left-4 right-4 bottom-4 text-white">
              <div className="font-display text-[18px] leading-tight">
                {b.title}
              </div>
              {b.description && (
                <div className="text-[12px] opacity-85 mt-1 line-clamp-2">
                  {b.description}
                </div>
              )}
              {b.link_label && (
                <div className="hv-mono text-[10px] tracking-[0.2em] opacity-80 mt-2">
                  {b.link_label} →
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-2.5">
          {banners.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-hv-navy" : "w-1.5 bg-hv-line",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
