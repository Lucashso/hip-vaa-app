// HVLogo — usa a logo oficial Hip Va'a (PNG em /logo-source.png).
// Prop `color` aceita "white" pra inverter (uso em fundo escuro), "navy"/qualquer outro
// mantém preto natural.

interface Props {
  size?: number;
  color?: string;
  className?: string;
}

export function HVLogo({ size = 64, color, className }: Props) {
  const isInverted =
    color === "white" ||
    color === "#fff" ||
    color === "#ffffff" ||
    color === "rgba(255,255,255,1)";

  return (
    <img
      src="/logo-source.png"
      width={size}
      height={size}
      alt="Hip Va'a"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: isInverted ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}
