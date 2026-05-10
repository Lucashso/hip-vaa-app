import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "ghost" | "outline" | "destructive";
type Size = "sm" | "default" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "bg-hv-navy text-white hover:bg-hv-blue",
  accent: "bg-hv-cyan text-hv-ink hover:brightness-95",
  outline: "bg-transparent border border-hv-line text-foreground hover:bg-hv-foam",
  ghost: "text-foreground hover:bg-hv-foam",
  destructive: "bg-hv-coral text-white hover:brightness-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  default: "h-10 px-4",
  lg: "h-12 px-5 text-[15px]",
  icon: "h-10 w-10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold",
        "transition-[background,transform,box-shadow] duration-150 ease-out",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
