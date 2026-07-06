"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorActionsProps {
  dirty: boolean;
  saving: boolean;
  hasErrors: boolean;
  onSave: () => void;
  onReset: () => void;
  /** `sm` for the sticky banner's compact buttons, `md` for the bottom action row. */
  size?: "sm" | "md";
}

/** Shared Save/Reset button pair so every editor's action row behaves identically. */
export function EditorActions({
  dirty,
  saving,
  hasErrors,
  onSave,
  onReset,
  size = "md",
}: EditorActionsProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant={size === "sm" ? "ghost" : "secondary"}
        size={size === "sm" ? "sm" : "md"}
        onClick={onReset}
        disabled={(size === "md" && !dirty) || saving}
      >
        <RotateCcw className={iconSize} />
        Reset
      </Button>
      <Button
        size={size === "sm" ? "sm" : "md"}
        onClick={onSave}
        disabled={(size === "md" && !dirty) || saving || hasErrors}
      >
        {saving ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <Save className={iconSize} />
        )}
        Save changes
      </Button>
    </div>
  );
}

interface UnsavedChangesBannerProps {
  dirty: boolean;
  saving: boolean;
  hasErrors: boolean;
  onSave: () => void;
  onReset: () => void;
}

/**
 * Sticky-feeling banner that appears the moment an editor becomes dirty.
 * Animates in/out for every editor identically; respects
 * `prefers-reduced-motion` by skipping the slide/fade and just toggling
 * visibility.
 */
export function UnsavedChangesBanner({
  dirty,
  saving,
  hasErrors,
  onSave,
  onReset,
}: UnsavedChangesBannerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {dirty ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-violet/40 bg-violet/[0.08] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-fog">
              <AlertTriangle className="h-4 w-4 shrink-0 text-violet-bright" />
              You have unsaved changes.
            </div>
            <EditorActions
              dirty={dirty}
              saving={saving}
              hasErrors={hasErrors}
              onSave={onSave}
              onReset={onReset}
              size="sm"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Red inline banner for a failed save's server-side error message. */
export function ServerErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-crimson/50 bg-crimson/[0.08] px-4 py-3 text-sm text-crimson-bright"
    >
      {message}
    </div>
  );
}
