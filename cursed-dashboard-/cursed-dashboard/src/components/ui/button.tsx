import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl border text-sm font-medium transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "border-violet/40 bg-gradient-to-r from-violet via-violet-dim to-crimson-dim text-white shadow-[0_10px_30px_rgba(124,58,237,0.24),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:border-violet-bright/60 hover:brightness-110 hover:shadow-[0_16px_38px_rgba(124,58,237,0.3),0_0_24px_rgba(220,20,60,0.12)]",
        secondary:
          "border-white/[0.08] bg-white/[0.04] text-fog backdrop-blur-xl hover:-translate-y-0.5 hover:border-violet/35 hover:bg-violet/[0.08]",
        ghost:
          "border-transparent bg-transparent text-ash hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-fog",
        outline:
          "border-white/10 bg-black/10 text-fog backdrop-blur-lg hover:-translate-y-0.5 hover:border-violet/45 hover:bg-violet/[0.07] hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
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
