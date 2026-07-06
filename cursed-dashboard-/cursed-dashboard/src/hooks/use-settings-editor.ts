"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseSettingsEditorOptions<T, E extends object> {
  /** API route this config is PUT to, e.g. `/api/guilds/${guildId}/welcome`. */
  endpoint: string;
  initialConfig: T;
  /** Returns a map of field -> error message. Empty/undefined values mean "no error". */
  validate: (config: T) => E;
  /** Toast title shown on a successful save, e.g. "Welcome settings saved". */
  successTitle: string;
  /** Fallback message shown when the API errors without its own `error` string. */
  genericErrorMessage: string;
  /** Override copy for the "can't save, fields are invalid" toast. */
  invalidFieldsTitle?: string;
  invalidFieldsDescription?: string;
}

/**
 * Every config editor in this dashboard (Welcome, Autorole, AI Settings,
 * Logs, Server Settings) follows the same shape: track a `saved` vs. `config`
 * pair to derive "dirty", warn on tab-close while dirty, validate
 * client-side before PUTting, and surface success/failure via toast. This
 * hook is that shared shape so each editor only supplies its endpoint,
 * validator, and copy — not another copy of the plumbing.
 *
 * `T` and the error-map type are both inferred from the arguments you pass
 * (don't specify type parameters explicitly at the call site) so each
 * editor's own `FieldErrors` shape flows straight through untouched.
 *
 * Editors that need to react to the raw response (e.g. LogsEditor pulling
 * per-category `fieldErrors` out of a failed save) can inspect the `data`
 * returned by `handleSave`.
 */
export function useSettingsEditor<T, E extends object>({
  endpoint,
  initialConfig,
  validate,
  successTitle,
  genericErrorMessage,
  invalidFieldsTitle = "Fix the highlighted fields",
  invalidFieldsDescription = "Some values aren't valid yet.",
}: UseSettingsEditorOptions<T, E>) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<T>(initialConfig);
  const [config, setConfig] = useState<T>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(saved),
    [config, saved]
  );
  const errors = useMemo(() => validate(config), [config, validate]);
  const hasErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  );

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patch = useCallback((next: Partial<T>) => {
    setConfig((prev) => ({ ...prev, ...next }));
  }, []);

  const handleSave = useCallback(async (): Promise<{
    ok: boolean;
    data: Record<string, unknown> | null;
  }> => {
    if (hasErrors) {
      toast({
        title: invalidFieldsTitle,
        description: invalidFieldsDescription,
        variant: "error",
      });
      return { ok: false, data: null };
    }

    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? genericErrorMessage;
        setServerError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return { ok: false, data };
      }

      setSaved(data.config as T);
      setConfig(data.config as T);
      toast({
        title: successTitle,
        description: "The bot will pick up this config on its next read.",
        variant: "success",
      });
      return { ok: true, data };
    } catch {
      const message = "Network error — couldn't reach the server.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
      return { ok: false, data: null };
    } finally {
      setSaving(false);
    }
  }, [
    config,
    endpoint,
    genericErrorMessage,
    hasErrors,
    invalidFieldsDescription,
    invalidFieldsTitle,
    successTitle,
    toast,
  ]);

  const handleReset = useCallback(() => {
    setConfig(saved);
    setServerError(null);
  }, [saved]);

  return {
    config,
    setConfig,
    patch,
    saved,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    setServerError,
    handleSave,
    handleReset,
  };
}
