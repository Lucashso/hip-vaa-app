import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-[12px] border border-hv-line bg-background",
        "px-3.5 py-2 text-sm text-foreground",
        "placeholder:text-hv-text-3",
        "transition-[border,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:border-hv-navy focus-visible:ring-2 focus-visible:ring-hv-navy/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
