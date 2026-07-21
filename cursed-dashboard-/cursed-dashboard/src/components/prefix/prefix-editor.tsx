"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Command, Info, ShieldCheck, Siren, Users } from "lucide-react";
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

interface PrefixCommandExample {
  name: string;
  syntax: string;
  description: string;
}

const PUBLIC_COMMANDS: PrefixCommandExample[] = [
  {
    name: "Server stats",
    syntax: "server stats",
    description: "Public read-only activity-tracking status for every member.",
  },
  {
    name: "Stats alias",
    syntax: "stats status",
    description: "Alternative public server-stats syntax.",
  },
  {
    name: "Help",
    syntax: "help moderation",
    description: "Open the updated moderation command catalog.",
  },
];

const CORE_MODERATION_COMMANDS: PrefixCommandExample[] = [
  { name: "Warn", syntax: "warn @user reason", description: "Warn a member and create a case." },
  { name: "Warnings", syntax: "warnings @user", description: "View active warnings." },
  { name: "Clear warnings", syntax: "clearwarns @user reason", description: "Clear active warnings." },
  { name: "Timeout", syntax: "timeout @user 10m reason", description: "Timeout a member." },
  { name: "Mute alias", syntax: "mute @user 10m reason", description: "Legacy timeout alias." },
  { name: "Remove timeout", syntax: "untimeout @user reason", description: "Remove a timeout." },
  { name: "Unmute alias", syntax: "unmute @user reason", description: "Legacy timeout-removal alias." },
  { name: "Kick", syntax: "kick @user reason", description: "Kick a member." },
  { name: "Ban", syntax: "ban @user reason", description: "Ban a member." },
  { name: "Unban", syntax: "unban 123456789012345678 reason", description: "Unban by Discord user ID." },
  { name: "Case", syntax: "case view 12", description: "View or manage one moderation case." },
  { name: "Cases", syntax: "cases @user BAN 10", description: "Filter recent moderation cases." },
  { name: "Purge", syntax: "purge 10", description: "Delete recent messages safely." },
];

const ADVANCED_MODERATION_COMMANDS: PrefixCommandExample[] = [
  { name: "Lock", syntax: "lock #channel reason", description: "Lock a text channel." },
  { name: "Unlock", syntax: "unlock #channel reason", description: "Restore the saved channel state." },
  { name: "Slowmode", syntax: "slowmode 10 #channel reason", description: "Set or disable slowmode." },
  { name: "Nickname", syntax: 'nickname @user "New Name" reason', description: "Set or reset a nickname." },
  { name: "Temporary ban", syntax: "tempban @user 7d reason", description: "Create a restart-safe temporary ban." },
  { name: "Softban", syntax: "softban @user 1 reason", description: "Remove recent messages while allowing rejoin." },
  { name: "Staff note", syntax: "note @user private note", description: "Add a private moderation case note." },
  { name: "History", syntax: "history @user 10", description: "View persisted moderation history." },
];

function CommandExampleGrid({
  commands,
  prefix,
}: {
  commands: PrefixCommandExample[];
  prefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {commands.map((command) => (
        <div
          key={command.name}
          className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-violet-bright/30 hover:bg-violet-bright/[0.05]"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ash">
            {command.name}
          </div>
          <code className="mt-1.5 block break-all text-sm text-fog">
            {prefix}{command.syntax}
          </code>
          <p className="mt-2 text-xs leading-5 text-ash">{command.description}</p>
        </div>
      ))}
    </div>
  );
}

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
  const previewPrefix = prefix || initialData.defaultPrefix;

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
      setSuccess("All supported prefix commands are now using this server prefix.");
      toast({
        title: "Command prefix saved",
        description: `Members can use ${data.prefix}server stats and moderators can use ${data.prefix}purge.`,
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

      <div className="max-w-6xl space-y-6">
        <DashboardCard
          title="Command prefix"
          description="Choose one prefix for public commands and the complete CURSED moderation suite."
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
              Your selected prefix is primary. <strong className="text-fog">{initialData.defaultPrefix}</strong> and legacy <strong className="text-fog">{initialData.legacyPrefix}</strong> remain compatibility aliases so existing commands do not suddenly break.
            </span>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Public member commands"
          description="Read-only commands available to normal server members."
          action={<Users className="h-5 w-5 text-violet-bright" />}
        >
          <CommandExampleGrid commands={PUBLIC_COMMANDS} prefix={previewPrefix} />
        </DashboardCard>

        <DashboardCard
          title="Core moderation commands"
          description="Foundation moderation commands with the same permissions, cases, and safety checks as their slash versions."
          action={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
        >
          <CommandExampleGrid commands={CORE_MODERATION_COMMANDS} prefix={previewPrefix} />
        </DashboardCard>

        <DashboardCard
          title="Advanced moderation commands"
          description="These commands also respect Advanced Moderation toggles, whitelists, dangerous-command restrictions, and role hierarchy."
          action={<Siren className="h-5 w-5 text-rose-300" />}
        >
          <CommandExampleGrid commands={ADVANCED_MODERATION_COMMANDS} prefix={previewPrefix} />
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
