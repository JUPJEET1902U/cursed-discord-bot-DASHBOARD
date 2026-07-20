import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/[0.09] bg-black/20 px-3.5 text-sm text-fog shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-lg placeholder:text-ash/65 transition-all duration-250 hover:border-white/[0.14] focus-visible:border-violet/55 focus-visible:bg-violet/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
