// Hip Va'a — minimal icon set (stroke-based, oceanic feel).
// Adaptado de Hip.zip components/icons.jsx pra TS + React-aware.

import { CSSProperties } from "react";

export type HVIconName =
  | "home" | "calendar" | "qr" | "wallet" | "compass" | "shop"
  | "users" | "user" | "bell" | "search" | "plus" | "check" | "x"
  | "chevron-right" | "chevron-left" | "chevron-down"
  | "arrow-up-right" | "arrow-right" | "arrow-left"
  | "trend" | "zap" | "wave" | "paddle" | "boat" | "dumbbell"
  | "sun" | "moon" | "filter" | "settings" | "trophy" | "gift"
  | "credit" | "pin" | "menu" | "logout" | "fire" | "share"
  | "copy" | "star" | "play";

interface HVIconProps {
  name: HVIconName;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function HVIcon({
  name,
  size = 20,
  stroke = 1.8,
  color = "currentColor",
  className,
  style,
}: HVIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3M21 14v3M14 21h7M17 17v4" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 7h15a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z" />
          <path d="M3 7V6a2 2 0 0 1 2-2h11" />
          <circle cx="17" cy="14" r="1.2" fill={color} stroke="none" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-2 5-5 2 2-5z" fill={color} fillOpacity={0.25} />
        </svg>
      );
    case "shop":
      return (
        <svg {...common}>
          <path d="M4 7h16l-1 4H5z" />
          <path d="M5 11v9h14v-9" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M21.5 18a4.5 4.5 0 0 0-6-4.2" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 5 5L20 7" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg {...common}>
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="M3 17 9 11l4 4 8-8" />
          <path d="M14 4h7v7" />
        </svg>
      );
    case "zap":
      return (
        <svg {...common}>
          <path d="M13 3 4 14h7l-1 7 9-11h-7z" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3 2-3 4-3" />
        </svg>
      );
    case "paddle":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="3.5" ry="5" />
          <path d="M12 11v10" />
          <path d="M10 4.5c1.5 0 2.5 1 2.5 1" />
        </svg>
      );
    case "boat":
      return (
        <svg {...common}>
          <path d="M3 16h18l-2 4H5z" />
          <path d="M5 16V8l7-4 7 4v8" />
          <path d="M12 4v12" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...common}>
          <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z" />
          <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="5" />
          <path d="M5 13v9h14v-9M12 8v14" />
          <path d="M12 8a3 3 0 1 0-3-3c0 1 1 3 3 3a3 3 0 1 0 3-3c0 1-1 3-3 3z" />
        </svg>
      );
    case "credit":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="13" rx="2" />
          <path d="M2 10h20M6 15h3" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
    case "fire":
      return (
        <svg {...common}>
          <path d="M12 22c4 0 7-3 7-7 0-4-3-5-3-9 0 0-3 1-4 5-1-1-2-2-2-4-3 2-5 5-5 8 0 4 3 7 7 7z" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="m8.5 11 7-4M8.5 13l7 4" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.6 5.5 6 .9-4.4 4.2 1 6-5.2-2.8L6.8 19.6l1-6L3.4 9.4l6-.9z" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <path d="M6 4 20 12 6 20Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function HVLogo({ size = 64, color = "currentColor", className }: { size?: number; color?: string; className?: string }) {
  // Glyph simplificado do logo HIP VA'A — paddle estilizado
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <ellipse cx="32" cy="20" rx="10" ry="14" stroke={color} strokeWidth="2.5" />
      <line x1="32" y1="34" x2="32" y2="56" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 14 L32 8 L37 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
