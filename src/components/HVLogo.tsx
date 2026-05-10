// HVLogo — paddle estilizado simplificado.

interface Props {
  size?: number;
  color?: string;
  className?: string;
}

export function HVLogo({ size = 64, color = "currentColor", className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <ellipse cx="32" cy="20" rx="10" ry="14" stroke={color} strokeWidth="2.5" />
      <line x1="32" y1="34" x2="32" y2="56" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 14 L32 8 L37 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
