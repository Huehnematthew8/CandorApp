import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-lg)] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--candor-gold)] text-[#1a1508] hover:bg-[var(--candor-gold2)] active:scale-[0.98]",
        destructive: "bg-[var(--candor-red)] text-white hover:opacity-90 active:opacity-95",
        outline:
          "border border-[var(--candor-border2)] bg-transparent text-[var(--candor-text)] hover:bg-[var(--candor-surface2)] hover:border-[var(--border2)]",
        secondary: "bg-[var(--candor-surface2)] text-[var(--candor-text)] hover:bg-[var(--candor-surface3)]",
        ghost: "text-[var(--candor-text)] hover:bg-[var(--candor-surface2)]",
        link: "text-[var(--candor-gold)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[var(--radius-lg)] px-3",
        lg: "h-11 rounded-[var(--radius-lg)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
