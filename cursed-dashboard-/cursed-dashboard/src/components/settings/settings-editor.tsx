"use client";

import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { GeneralSection } from "@/components/settings/general-section";
import { AIDefaultsSection } from "@/components/settings/ai-defaults-section";
import { ModerationDefaultsSection } from "@/components/settings/moderation-defaults-section";
import { PremiumSection } from "@/components/settings/premium-section";
import { useSettingsEditor } from "@/hooks/use-settings-editor";
import type { GuildSettings } from "@/types/guild-settings";
import type { PremiumStatus } from "@/types/premium";

interface SettingsEditorProps {
  guildId: string;
  guildName: string;
  initialConfig: GuildSettings;
  premium: PremiumStatus;
}

type FieldErrors = Partial<{
  displayName: string;
  accentColor: string;
  embedColor: string;
  timezone: string;
  personality: string;
  cooldown: string;
  timeoutMinutes: string;
  warningThreshold: string;
}>;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * Mirrors `guildSettingsSchema` (`src/lib/validation/settings.ts`) for
 * instant client-side feedback, same "duplicate a subset of the schema's
 * rules by hand" pattern already used by Welcome/Autorole/AI Settings. The
 * server re-validates with the real Zod schema on every save.
 */
function validate(config: GuildSettings): FieldErrors {
  const errors: FieldErrors = {};
  const { general, aiDefaults, moderationDefaults } = config;

  if (general.displayName.length > 100) {
    errors.displayName = "Display name must be 100 characters or fewer.";
  }
  if (!HEX_COLOR.test(general.accentColor)) {
    errors.accentColor = "Color must be a hex value, e.g. #8B5CF6.";
  }
  if (!HEX_COLOR.test(general.embedColor)) {
    errors.embedColor = "Color must be a hex value, e.g. #8B5CF6.";
  }

  if (aiDefaults.personality.length > 2000) {
    errors.personality = "Personality must be 2000 characters or fewer.";
  }
  if (
    !Number.isInteger(aiDefaults.cooldown) ||
    aiDefaults.cooldown < 0 ||
    aiDefaults.cooldown > 3600
  ) {
    errors.cooldown = "Cooldown must be a whole number between 0 and 3600.";
  }

  if (
    !Number.isInteger(moderationDefaults.timeoutMinutes) ||
    moderationDefaults.timeoutMinutes < 1 ||
    moderationDefaults.timeoutMinutes > 40320
  ) {
    errors.timeoutMinutes =
      "Timeout must be a whole number of minutes, up to 40320 (28 days).";
  }
  if (
    !Number.isInteger(moderationDefaults.warningThreshold) ||
    moderationDefaults.warningThreshold < 1 ||
    moderationDefaults.warningThreshold > 20
  ) {
    errors.warningThreshold = "Warning threshold must be between 1 and 20.";
  }

  return errors;
}

export function SettingsEditor({
  guildId,
  guildName,
  initialConfig,
  premium,
}: SettingsEditorProps) {
  const {
    config,
    setConfig,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    handleSave,
    handleReset,
  } = useSettingsEditor({
    endpoint: `/api/guilds/${guildId}/settings`,
    initialConfig,
    validate,
    successTitle: "Server settings saved",
    genericErrorMessage: "Couldn't save server settings.",
  });

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={handleSave}
        onReset={handleReset}
      />

      <ServerErrorBanner message={serverError} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <GeneralSection
            guildName={guildName}
            config={config.general}
            disabled={saving}
            errors={errors}
            onChange={(general) => setConfig((prev) => ({ ...prev, general }))}
          />
          <ModerationDefaultsSection
            config={config.moderationDefaults}
            disabled={saving}
            errors={errors}
            onChange={(moderationDefaults) =>
              setConfig((prev) => ({ ...prev, moderationDefaults }))
            }
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <AIDefaultsSection
            config={config.aiDefaults}
            disabled={saving}
            errors={errors}
            onChange={(aiDefaults) =>
              setConfig((prev) => ({ ...prev, aiDefaults }))
            }
          />
          <PremiumSection premium={premium} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <EditorActions
          dirty={dirty}
          saving={saving}
          hasErrors={hasErrors}
          onSave={handleSave}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
