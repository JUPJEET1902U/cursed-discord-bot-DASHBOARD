"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Command, Info } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { prefixSchema } from "@/lib/validation/prefix";
import type { PrefixData } from "@/types/prefix";

interface PrefixEditorProps {
  guildId: string;
  initialData: PrefixData;
}

const COMMANDS = ["ban", "kick", "warn", "timeout", "purge", "help"] as const;

export function PrefixEditor({ guildId, initialData }: PrefixEditorProps) {
  const { toast } = useToast();
  const [savedPrefix, setSavedPrefix] = useState(initialData.prefix);
  const [prefix, setPrefix] = useState(initialData.prefix);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validation = useMemo(() => prefixSchema.safeParse({ prefix }), [prefix]);
  const validationError = validation.success
    ? null
    : validation.error.issues[0]?.message ?? "Enter a valid prefix.";
  const hasErrors = Boolean(validationError || fieldError);
  const dirty = prefix !== savedPrefix;

  const reset = useCallback(() => {
    setPrefix(savedPrefix);
    setServerError(null);
    setFieldError(null);
    setSuccess(null);
  }, [savedPrefix]);

  const save = useCallback(async () => {
    const parsed = prefixSchema.safeParse({ prefix });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Enter a valid prefix.";
      setFieldError(message);
      toast({ title: "Prefix needs attention", description: message, variant: "error" });
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/prefix`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as PrefixData & {
        error?: string;
        fieldErrors?: Record<string, string[]>;
      };
      if (!response.ok) {
        const message = data.fieldErrors?.prefix?.[0] ?? data.error ?? "Couldn't save prefix settings.";
        setServerError(message);
        setFieldError(data.fieldErrors?.prefix?.[0] ?? null);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }

      setPrefix(data.prefix);
      setSavedPrefix(data.prefix);
      setSuccess("The live CURSED bot is now using this prefix.");
      toast({
        title: "Command prefix saved",
        description: `Members can now use ${data.prefix}help.`,
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the dashboard API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [guildId, prefix, toast]);

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={save}
        onReset={reset}
      />
      <ServerErrorBanner message={serverError ?? validationError ?? fieldError} />

      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="max-w-3xl space-y-6">
        <DashboardCard
          title="Command prefix"
          description="The default CURSED prefix is c!. Each server can choose its own prefix."
          action={<Command className="h-5 w-5 text-violet-bright" />}
        >
          <div>
            <Label htmlFor="command-prefix">Server prefix</Label>
            <Input
              id="command-prefix"
              className="mt-1.5 max-w-xs font-mono text-lg"
              value={prefix}
              maxLength={initialData.maxLength}
              onChange={(event) => {
                setPrefix(event.target.value);
                setFieldError(null);
                setServerError(null);
                setSuccess(null);
              }}
              disabled={saving}
              autoComplete="off"
              spellCheck={false}
              placeholder={initialData.defaultPrefix}
            />
            <p className="mt-1.5 text-xs text-ash">
              Use 1-{initialData.maxLength} characters. Spaces, slashes, mentions, angle brackets, and backticks are blocked.
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-ash">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-bright" />
            <span>
              <strong className="text-fog">{initialData.defaultPrefix}</strong> and the legacy <strong className="text-fog">{initialData.legacyPrefix}</strong> remain safe fallback aliases so existing commands do not suddenly break.
            </span>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Command examples"
          description="These examples update while you type."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {COMMANDS.map((command) => (
              <div
                key={command}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 font-mono text-sm text-fog"
              >
                {prefix || initialData.defaultPrefix}{command}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-ash">
            Moderation examples: <code>{prefix || initialData.defaultPrefix}warn @user reason</code>, <code>{prefix || initialData.defaultPrefix}timeout @user 10m reason</code>, and <code>{prefix || initialData.defaultPrefix}purge 10</code>.
          </div>
        </DashboardCard>

        <div className="flex justify-end">
          <EditorActions
            dirty={dirty}
            saving={saving}
            hasErrors={hasErrors}
            onSave={save}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
