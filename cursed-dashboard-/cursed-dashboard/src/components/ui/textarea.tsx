import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[5rem] w-full resize-y rounded-lg border border-white/10 bg-steel/60 px-3.5 py-2.5 text-sm text-fog placeholder:text-ash/70 transition-colors duration-200 focus-visible:outline-none focus-visible:border-violet/60 focus-visible:ring-1 focus-visible:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
