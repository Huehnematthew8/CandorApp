import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[var(--candor-border)] bg-[var(--candor-surface2)] px-3 py-2 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--candor-gold)]/30 focus:border-[var(--candor-gold)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
