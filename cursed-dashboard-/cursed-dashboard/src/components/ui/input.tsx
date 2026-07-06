import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog placeholder:text-ash/70 transition-colors duration-200 focus-visible:outline-none focus-visible:border-violet/60 focus-visible:ring-1 focus-visible:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
