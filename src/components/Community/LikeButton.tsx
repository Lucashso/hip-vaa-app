// LikeButton — coração animado com toggle.

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
}

export function LikeButton({ liked, count, onToggle, disabled = false }: LikeButtonProps) {
  const [burst, setBurst] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 300);
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 text-[12px] transition-colors",
        liked ? "text-[hsl(var(--hv-coral))]" : "text-hv-text-2 hover:text-foreground",
        "disabled:opacity-40",
      )}
      aria-label={liked ? "Descurtir" : "Curtir"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={liked ? 0 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "transition-transform",
          burst && "scale-[1.35]",
          liked && "scale-[1.1]",
        )}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
