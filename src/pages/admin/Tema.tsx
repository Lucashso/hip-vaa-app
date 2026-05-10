// Admin · Tema & marca — preview + paleta cores + fonte.
// Baseado em admin-mobile.jsx HVAdminTema.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { HVIcon, HVLogo } from "@/lib/HVIcon";
import { cn } from "@/lib/utils";

const PALETTE = ["#0E3A5F", "#1B6FB0", "#25C7E5", "#FF6B4A", "#2FB37A", "#F2B544"];
const FONTS = [
  { n: "Bricolage", fam: "var(--hv-font-display, 'Bricolage Grotesque')" },
  { n: "Inter Bold", fam: "Inter, sans-serif" },
  { n: "Poppins", fam: "system-ui, sans-serif" },
];

export default function AdminTema() {
  const [color, setColor] = useState(0);
  const [font, setFont] = useState(0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Tema & marca" sub="PERSONALIZAR APP" />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        <div
          className="hv-card p-3.5"
          style={{ background: "hsl(var(--hv-foam))" }}
        >
          <div
            className="hv-mono text-[10px] text-hv-navy font-bold"
            style={{ letterSpacing: "0.12em" }}
          >
            PREVIEW AO VIVO
          </div>
          <div
            className="mt-2.5 p-3.5 rounded-[14px] text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, #061826, ${PALETTE[color]})` }}
          >
            <svg
              viewBox="0 0 280 60"
              className="absolute bottom-0 left-0 right-0 w-full opacity-40"
              preserveAspectRatio="none"
            >
              <path
                d="M0 40 Q70 28 140 40 T280 40 L280 60 L0 60Z"
                fill="hsl(var(--hv-cyan))"
              />
            </svg>
            <div className="relative">
              <div
                className="hv-mono text-[9px] opacity-70"
                style={{ letterSpacing: "0.12em" }}
              >
                HIP VA'A
              </div>
              <div className="font-display text-[18px] font-extrabold text-white mt-1">
                Bora remar
              </div>
              <button
                type="button"
                className="mt-3 px-3.5 py-2 rounded-[10px] text-[11px] font-bold border-0"
                style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
              >
                Check-in agora
              </button>
            </div>
          </div>
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-3.5 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Cor primária
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {PALETTE.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(i)}
              className="aspect-square rounded-[12px] grid place-items-center"
              style={{
                background: c,
                border:
                  color === i
                    ? "3px solid hsl(var(--hv-text))"
                    : "1px solid hsl(var(--hv-line))",
              }}
            >
              {color === i && <HVIcon name="check" size={18} color="white" stroke={3} />}
            </button>
          ))}
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-3.5 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Logo
        </h3>
        <div
          className="hv-card p-4 text-center"
          style={{ border: "2px dashed hsl(var(--hv-line))" }}
        >
          <HVLogo size={56} color="hsl(var(--hv-navy))" />
          <button
            type="button"
            className="mt-2 px-3.5 py-2 rounded-[8px] text-[12px] font-semibold text-hv-text"
            style={{
              background: "hsl(var(--hv-bg))",
              border: "1px solid hsl(var(--hv-line))",
            }}
          >
            Substituir logo
          </button>
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-3.5 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          Fonte de títulos
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f, i) => (
            <button
              key={f.n}
              type="button"
              onClick={() => setFont(i)}
              className={cn("hv-card p-2.5 text-center")}
              style={{
                border:
                  font === i
                    ? "2px solid hsl(var(--hv-navy))"
                    : "1px solid hsl(var(--hv-line))",
                background: font === i ? "hsl(var(--hv-foam))" : "hsl(var(--hv-surface))",
              }}
            >
              <div
                style={{
                  fontFamily: f.fam,
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Aa
              </div>
              <div className="text-[10px] text-hv-text-3 mt-0.5">{f.n}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="w-full mt-4 py-3.5 rounded-[14px] text-white font-bold text-[14px] border-0"
          style={{ background: "hsl(var(--hv-navy))" }}
        >
          Salvar tema
        </button>
      </div>
    </div>
  );
}
