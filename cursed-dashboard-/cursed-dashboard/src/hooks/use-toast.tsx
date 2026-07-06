"use client";

import * as React from "react";
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "success" | "error";
}

interface ToastRecord extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * App-wide toast provider. Wrap once near the root of the authenticated
 * dashboard shell (`(dashboard)/layout.tsx`) — any Client Component
 * underneath can then call `useToast().toast(...)` without prop-drilling.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToastProvider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map(({ id, title, description, variant = "success" }) => (
          <Toast
            key={id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) dismiss(id);
            }}
          >
            <ToastIcon variant={variant} />
            <div className="min-w-0 flex-1">
              <ToastTitle>{title}</ToastTitle>
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            <ToastClose aria-label="Dismiss notification" />
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be used within <ToastProvider>.");
  }
  return ctx;
}
