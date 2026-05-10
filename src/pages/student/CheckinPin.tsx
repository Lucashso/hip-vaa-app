// CheckinPin — keypad numérico fallback offline.

import { useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { HVIcon } from "@/lib/HVIcon";
import { useNavigate } from "react-router-dom";

export default function CheckinPin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState<string[]>([]);

  const handleKey = (k: string) => {
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    setPin((p) => [...p, k]);
  };

  const keys = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "⌫"]];
  const display = ["•", "•", "•", "•"].map((d, i) => pin[i] ?? d);

  return (
    <PageScaffold eyebrow="DIGITE SEU PIN" title="Check-in offline" back showTabBar={false}>
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hv-foam text-hv-navy">
          <span className="w-1.5 h-1.5 rounded-full bg-hv-leaf" />
          <span className="font-mono text-[10px] tracking-[0.14em] font-bold">SEM CONEXÃO · USANDO PIN LOCAL</span>
        </div>
      </div>

      <div className="flex justify-center gap-3.5 my-6">
        {display.map((d, i) => {
          const filled = pin[i] !== undefined;
          return (
            <div
              key={i}
              className="w-14 h-[70px] rounded-[16px] grid place-items-center font-display font-extrabold text-[30px]"
              style={{
                background: filled ? "hsl(var(--hv-navy))" : "hsl(var(--hv-surface))",
                color: filled ? "white" : "hsl(var(--hv-text-3))",
                border: filled ? "none" : "1px solid hsl(var(--hv-line))",
                boxShadow: filled ? "0 8px 20px -8px hsl(var(--hv-navy) / 0.5)" : "none",
              }}
            >
              {filled ? d : <span className="w-3 h-3 rounded-full bg-hv-line" />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {keys.flat().map((k, i) =>
          !k ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => handleKey(k)}
              className="h-16 rounded-[18px] border border-hv-line bg-hv-surface
                         font-display font-bold text-[26px] text-foreground
                         hover:bg-hv-foam transition-all active:scale-[0.97]"
            >
              {k}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => navigate("/checkin")}
        className="flex items-center gap-3 p-3.5 rounded-[14px] bg-hv-foam border border-hv-line w-full text-left hover:border-hv-text-3"
      >
        <HVIcon name="qr" size={18} color="hsl(var(--hv-navy))" stroke={2.2} />
        <div className="flex-1">
          <div className="text-[13px] font-bold">Voltar pro QR Code</div>
          <div className="text-[11px] text-hv-text-2">Quando tiver conexão</div>
        </div>
        <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
      </button>
    </PageScaffold>
  );
}
