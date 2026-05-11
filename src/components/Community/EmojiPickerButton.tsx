// EmojiPickerButton — botão emoji com set fixo de 30 emojis (sem dependência externa).

import { useState, useRef, useEffect } from "react";
import { HVIcon } from "@/lib/HVIcon";

const EMOJI_SET = [
  "😀","😂","😍","🥰","😎","🤩","🙌","👏","💪","🔥",
  "⚡","🌊","🏄","🚣","🛶","🏆","🥇","🎉","🎊","✨",
  "❤️","💛","💙","💚","🙏","👍","👋","🤙","✌️","💯",
];

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPickerButton({ onEmojiSelect }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-[10px] grid place-items-center text-hv-text-2 hover:bg-hv-foam transition-colors"
        aria-label="Emojis"
      >
        <HVIcon name="star" size={16} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-hv-surface border border-hv-line rounded-[14px] p-2 shadow-lg z-10 w-[200px]">
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_SET.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onEmojiSelect(emoji);
                  setOpen(false);
                }}
                className="w-7 h-7 text-[18px] grid place-items-center rounded-[6px] hover:bg-hv-foam transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
