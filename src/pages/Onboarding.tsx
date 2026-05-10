// Onboarding — 4 telas swipeable pré-login (Hip.zip HVOnboarding).
// Hero ilustrado (sun/boat/stars/ocean), progress dots, CTA next.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hipvaa_onboarding_seen";

interface Slide {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  art: "sun" | "boat" | "stars" | "ocean";
}

const slides: Slide[] = [
  {
    eyebrow: "BEM-VINDO À TRIBO",
    title: <>Hip Va'a:<br />o oceano<br />em movimento.</>,
    description: "Plataforma do clube de canoa havaiana. Treine, descubra passeios e ganhe créditos por trazer amigos.",
    art: "sun",
  },
  {
    eyebrow: "VOCÊ FAZ PARTE",
    title: <>Treinos, passeios<br />& comunidade.</>,
    description: "Confira sua próxima aula, marque presença em um piscar de olhos e descubra os passeios da temporada.",
    art: "boat",
  },
  {
    eyebrow: "PERFORMANCE",
    title: <>Sua evolução<br />em remadas.</>,
    description: "Acompanhe ofensivas, frequência e marcos. Cada remada é registrada e celebrada pela tribo.",
    art: "stars",
  },
  {
    eyebrow: "ESTÁ NA HORA",
    title: <>O oceano<br />te chama.</>,
    description: "Faça login com a conta cedida pelo seu clube e comece. Sem conta? A Sede Hip Va'a abre filiais novas todo mês.",
    art: "ocean",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        navigate("/auth", { replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [navigate]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    navigate("/auth");
  };

  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const onNext = () => (isLast ? finish() : setIndex((i) => i + 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero ilustrado */}
      <div
        className="relative h-[420px] overflow-hidden shrink-0"
        style={{
          background: "linear-gradient(180deg, hsl(var(--hv-navy)) 0%, hsl(var(--hv-blue)) 100%)",
        }}
      >
        <svg aria-hidden viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <pattern id="onb-stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            </pattern>
          </defs>
          <rect width="390" height="420" fill="url(#onb-stripes)" />

          {slide.art === "sun" && (
            <>
              <circle cx="195" cy="170" r="80" fill="#FFB94A" fillOpacity="0.3" />
              <circle cx="195" cy="170" r="50" fill="#FFB94A" fillOpacity="0.55" />
              <circle cx="195" cy="170" r="26" fill="#FFB94A" fillOpacity="0.85" />
            </>
          )}

          {slide.art === "boat" && (
            <>
              <circle cx="290" cy="120" r="50" fill="#FFB94A" fillOpacity="0.3" />
              <circle cx="290" cy="120" r="32" fill="#FFB94A" fillOpacity="0.55" />
              <path d="M70 280 Q 195 250 320 280 L 305 305 Q 195 280 85 305Z" fill="hsl(var(--hv-ink))" />
              <line x1="195" y1="220" x2="195" y2="280" stroke="hsl(var(--hv-ink))" strokeWidth="3" />
              <path d="M195 220 L 230 260 L 195 250Z" fill="hsl(var(--hv-cyan))" />
            </>
          )}

          {slide.art === "stars" && (
            <>
              {[
                [80, 90, 4], [140, 60, 3], [220, 110, 5], [310, 80, 4],
                [350, 150, 3], [60, 200, 3], [180, 230, 4], [280, 210, 5],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="hsl(var(--hv-cyan))" fillOpacity="0.7" />
              ))}
              <path
                d="M80 90 L 140 60 L 220 110 L 310 80 M 220 110 L 280 210 L 180 230 L 60 200"
                stroke="hsl(var(--hv-cyan) / 0.3)"
                fill="none"
                strokeWidth="1"
              />
              <circle cx="195" cy="320" r="60" fill="hsl(var(--hv-cyan) / 0.18)" />
            </>
          )}

          {slide.art === "ocean" && (
            <>
              <circle cx="195" cy="100" r="60" fill="#FFB94A" fillOpacity="0.3" />
              <circle cx="195" cy="100" r="38" fill="#FFB94A" fillOpacity="0.55" />
              <path d="M0 280 Q 90 250 195 280 T 410 280 L 410 420 L 0 420Z" fill="hsl(var(--hv-cyan) / 0.2)" />
              <path d="M0 320 Q 90 290 195 320 T 410 320 L 410 420 L 0 420Z" fill="hsl(var(--hv-cyan) / 0.35)" />
              <path d="M0 360 Q 90 330 195 360 T 410 360 L 410 420 L 0 420Z" fill="hsl(var(--hv-cyan) / 0.5)" />
            </>
          )}
        </svg>

        <div className="absolute top-6 left-6 font-mono text-[11px] tracking-[0.24em] text-white/80">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
        {!isLast && (
          <button
            onClick={finish}
            className="absolute top-6 right-6 text-[13px] font-medium text-white/80 hover:text-white"
          >
            Pular →
          </button>
        )}
      </div>

      {/* Texto */}
      <div className="px-6 pt-8 flex-1 flex flex-col">
        <div
          className="hv-chip"
          style={{
            background: "hsl(var(--hv-cyan) / 0.15)",
            color: "hsl(var(--hv-blue))",
          }}
        >
          {slide.eyebrow}
        </div>
        <h1 className="font-display text-[32px] mt-3.5 leading-[1.05]">{slide.title}</h1>
        <p className="mt-3.5 text-hv-text-2 text-[15px] leading-relaxed max-w-md">
          {slide.description}
        </p>

        <div className="flex-1" />

        <div className="pb-8 pt-6 flex items-center gap-3">
          <div className="flex gap-1.5 flex-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-200",
                  i === index ? "w-7 bg-hv-navy" : "w-5 bg-hv-line",
                )}
              />
            ))}
          </div>
          <button
            onClick={onNext}
            className="w-14 h-14 rounded-full bg-hv-navy text-white grid place-items-center
                       transition-transform active:scale-[0.96] hover:bg-hv-blue"
          >
            {isLast ? <HVIcon name="check" size={22} stroke={2.4} /> : <HVIcon name="arrow-right" size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}
