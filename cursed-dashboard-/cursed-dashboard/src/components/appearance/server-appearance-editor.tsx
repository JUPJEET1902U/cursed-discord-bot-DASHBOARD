"use client";
/* eslint-disable @next/next/no-img-element -- this editor must preview arbitrary HTTPS and local data: images before save. */

import { useMemo, useRef, useState, type RefObject } from "react";
import {
  CircleUserRound,
  Crown,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  TextQuote,
  Upload,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  ServerAppearanceData,
  ServerAppearanceUpdate,
} from "@/types/server-appearance";

interface ServerAppearanceEditorProps {
  guildId: string;
  guildName: string;
  initialData: ServerAppearanceData;
}

type MediaKind = "avatar" | "banner";
type MediaDraft = string | null | undefined;

const ACCEPTED_UPLOADS = "image/jpeg,image/png,image/gif";

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read that image."));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That image could not be decoded."));
    };
    image.src = objectUrl;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not optimize that image."))),
      "image/jpeg",
      quality
    );
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (sourceRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / targetRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

async function optimizeLocalImage(
  file: File,
  kind: MediaKind,
  maxBytes: number
): Promise<string> {
  if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
    throw new Error("Use a JPG, PNG, or GIF image.");
  }
  if (file.size <= maxBytes) return readFileAsDataUrl(file);
  if (file.type === "image/gif") {
    throw new Error(
      "That animated GIF is too large. Use a smaller GIF or a public HTTPS image URL."
    );
  }

  const image = await loadBrowserImage(file);
  const baseWidth =
    kind === "avatar"
      ? Math.min(512, image.naturalWidth, image.naturalHeight)
      : Math.min(1024, image.naturalWidth);
  const baseHeight =
    kind === "avatar" ? baseWidth : Math.max(1, Math.round(baseWidth / 3.2));

  for (const scale of [1, 0.82, 0.68]) {
    const width = Math.max(96, Math.round(baseWidth * scale));
    const height = Math.max(
      kind === "avatar" ? 96 : 48,
      Math.round(baseHeight * scale)
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image optimization is unavailable in this browser.");

    context.fillStyle = "#090611";
    context.fillRect(0, 0, width, height);
    drawCover(context, image, width, height);

    for (const quality of [0.9, 0.82, 0.72, 0.62, 0.52]) {
      const blob = await canvasBlob(canvas, quality);
      if (blob.size <= maxBytes) return readFileAsDataUrl(blob);
    }
  }

  throw new Error(
    "That image is still too large after optimization. Use a smaller file or a public HTTPS URL."
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300">
      <Crown className="h-3 w-3" /> Premium
    </span>
  );
}

function CurrentMedia({
  kind,
  url,
}: {
  kind: MediaKind;
  url: string | null;
}) {
  if (kind === "avatar") {
    return (
      <div className="flex min-h-28 items-center justify-center">
        {url ? (
          <img
            src={url}
            alt="Current CURSED server avatar"
            className="h-24 w-24 rounded-full border-2 border-violet/30 object-cover shadow-[0_0_28px_rgba(124,58,237,0.18)]"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/[0.03] text-ash">
            <CircleUserRound className="h-8 w-8" />
          </div>
        )}
      </div>
    );
  }

  return url ? (
    <div className="aspect-[16/5] overflow-hidden rounded-xl border border-white/[0.07] bg-black/30">
      <img src={url} alt="Current CURSED server banner" className="h-full w-full object-cover" />
    </div>
  ) : (
    <div className="flex aspect-[16/5] items-center justify-center rounded-xl border border-dashed border-white/10 bg-gradient-to-br from-violet/[0.08] via-black/20 to-crimson/[0.06] text-xs text-ash">
      No custom or global banner is currently available.
    </div>
  );
}

function PendingMedia({ kind, url }: { kind: MediaKind; url: string | null }) {
  if (kind === "avatar") {
    return (
      <div className="mb-3 flex justify-center rounded-lg border border-white/[0.06] bg-black/15 p-3">
        {url ? (
          <img src={url} alt="Pending avatar preview" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="py-6 text-xs text-ash">Reset to global avatar</span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 aspect-[16/5] overflow-hidden rounded-lg border border-white/[0.06] bg-black/20">
      {url ? (
        <img src={url} alt="Pending banner preview" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-ash">
          Reset to global banner
        </div>
      )}
    </div>
  );
}

function MediaEditor({
  kind,
  title,
  description,
  currentUrl,
  previewUrl,
  customActive,
  premium,
  saving,
  uploadLabel,
  urlValue,
  fileInputRef,
  onUrlChange,
  onUpload,
  onReset,
}: {
  kind: MediaKind;
  title: string;
  description: string;
  currentUrl: string | null;
  previewUrl: string | null;
  customActive: boolean;
  premium: boolean;
  saving: boolean;
  uploadLabel: string | null;
  urlValue: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUrlChange: (value: string) => void;
  onUpload: (file: File) => void;
  onReset: () => void;
}) {
  const Icon = kind === "avatar" ? CircleUserRound : ImageIcon;
  const changed = previewUrl !== currentUrl;

  return (
    <DashboardCard title={title} description={description} icon={Icon} action={<PremiumBadge />}>
      <div className="rounded-xl border border-white/[0.06] bg-black/15 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ash">
            Currently active
          </p>
          <span className={`text-[10px] font-medium ${customActive ? "text-violet-bright" : "text-ash"}`}>
            {customActive ? "Server-specific" : "Global CURSED profile"}
          </span>
        </div>
        <CurrentMedia kind={kind} url={currentUrl} />
      </div>

      <div className="mt-4 rounded-xl border border-violet/15 bg-violet/[0.025] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label htmlFor={`${kind}-url`}>Update media</Label>
          {changed ? (
            <span className="text-[10px] font-medium text-violet-bright">
              Previewing unsaved change
            </span>
          ) : null}
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-ash">
          Enter a public HTTPS image URL or upload a local JPG, PNG, or GIF. Local files are optimized before upload.
        </p>

        {changed ? <PendingMedia kind={kind} url={previewUrl} /> : null}

        <div className="flex gap-2">
          <Input
            id={`${kind}-url`}
            type="url"
            placeholder="https://..."
            value={urlValue}
            onChange={(event) => onUrlChange(event.target.value)}
            disabled={!premium || saving}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_UPLOADS}
            disabled={!premium || saving}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!premium || saving}
          >
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="truncate text-[10px] text-ash">
            {uploadLabel ??
              (customActive
                ? "A server-specific image is active."
                : "Using the global CURSED profile image.")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!premium || saving}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset {kind}
          </Button>
        </div>
      </div>
    </DashboardCard>
  );
}

export function ServerAppearanceEditor({
  guildId,
  guildName,
  initialData,
}: ServerAppearanceEditorProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [avatarDraft, setAvatarDraft] = useState<MediaDraft>();
  const [bannerDraft, setBannerDraft] = useState<MediaDraft>();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUploadLabel, setAvatarUploadLabel] = useState<string | null>(null);
  const [bannerUploadLabel, setBannerUploadLabel] = useState<string | null>(null);
  const [bio, setBio] = useState(data.profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const savedBio = data.profile.bio ?? "";
  const normalizedBio = bio.trim();
  const dirty =
    avatarDraft !== undefined ||
    bannerDraft !== undefined ||
    normalizedBio !== savedBio;
  const bioError = bio.length > data.limits.bioMaxLength;
  const mediaError = [avatarDraft, bannerDraft].some(
    (value) =>
      typeof value === "string" &&
      !value.startsWith("data:image/") &&
      !value.startsWith("https://")
  );
  const hasErrors = bioError || mediaError;

  const avatarPreview = useMemo(() => {
    if (avatarDraft === null) {
      return data.profile.globalAvatarUrl ?? data.profile.avatarUrl;
    }
    return avatarDraft ?? data.profile.avatarUrl;
  }, [avatarDraft, data.profile.avatarUrl, data.profile.globalAvatarUrl]);

  const bannerPreview = useMemo(() => {
    if (bannerDraft === null) return data.profile.globalBannerUrl;
    return bannerDraft ?? data.profile.bannerUrl;
  }, [bannerDraft, data.profile.bannerUrl, data.profile.globalBannerUrl]);

  function resetDrafts(next = data) {
    setAvatarDraft(undefined);
    setBannerDraft(undefined);
    setAvatarUrl("");
    setBannerUrl("");
    setAvatarUploadLabel(null);
    setBannerUploadLabel(null);
    setBio(next.profile.bio ?? "");
    setServerError(null);
  }

  async function handleLocalUpload(kind: MediaKind, file: File) {
    if (!data.premium) return;
    setServerError(null);
    try {
      const optimized = await optimizeLocalImage(
        file,
        kind,
        data.limits.localUploadBytes
      );
      if (kind === "avatar") {
        setAvatarDraft(optimized);
        setAvatarUrl("");
        setAvatarUploadLabel(`${file.name} ready to save`);
      } else {
        setBannerDraft(optimized);
        setBannerUrl("");
        setBannerUploadLabel(`${file.name} ready to save`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not prepare that image.";
      setServerError(message);
      toast({ title: "Image not ready", description: message, variant: "error" });
    }
  }

  async function saveAppearance() {
    if (!data.premium) {
      toast({
        title: "Premium required",
        description:
          "Per-server CURSED appearance is available only while this server has Premium.",
        variant: "error",
      });
      return;
    }
    if (!dirty || hasErrors) return;

    const update: ServerAppearanceUpdate = {};
    if (avatarDraft !== undefined) update.avatar = avatarDraft;
    if (bannerDraft !== undefined) update.banner = bannerDraft;
    if (normalizedBio !== savedBio) update.bio = normalizedBio || null;

    setSaving(true);
    setServerError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/appearance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const result = (await response.json().catch(() => null)) as
        | (ServerAppearanceData & { error?: string })
        | null;
      if (!response.ok || !result) {
        const message =
          result?.error ?? "Could not save CURSED server appearance.";
        setServerError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }

      setData(result);
      resetDrafts(result);
      toast({
        title: "Server appearance updated",
        description: `CURSED now uses this appearance in ${guildName}.`,
        variant: "success",
      });
    } catch {
      const message = "Network error — could not reach the server.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function factoryReset() {
    if (!data.profile.hasCustomAppearance || resetting) return;
    if (
      !window.confirm(
        "Reset the CURSED server avatar, banner, and bio back to the global profile?"
      )
    ) {
      return;
    }

    setResetting(true);
    setServerError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/appearance`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as
        | (ServerAppearanceData & { error?: string })
        | null;
      if (!response.ok || !result) {
        const message =
          result?.error ?? "Could not reset CURSED server appearance.";
        setServerError(message);
        toast({ title: "Reset failed", description: message, variant: "error" });
        return;
      }

      setData(result);
      resetDrafts(result);
      toast({
        title: "Appearance reset",
        description:
          "CURSED is using its global/default profile in this server again.",
        variant: "success",
      });
    } catch {
      const message = "Network error — could not reach the server.";
      setServerError(message);
      toast({ title: "Reset failed", description: message, variant: "error" });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors || !data.premium}
        onSave={saveAppearance}
        onReset={() => resetDrafts()}
      />
      <ServerErrorBanner message={serverError} />

      <div className="max-w-6xl space-y-6">
        <div
          className={`rounded-xl border px-4 py-3 ${
            data.premium
              ? "border-amber-400/25 bg-amber-400/[0.055]"
              : "border-violet/25 bg-violet/[0.055]"
          }`}
        >
          <div className="flex items-start gap-3">
            <Crown
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                data.premium ? "text-amber-300" : "text-violet-bright"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-fog">
                {data.premium
                  ? "Premium server appearance is active"
                  : "Premium required to customize CURSED"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ash">
                {data.premium
                  ? `Changes on this page affect CURSED only in ${guildName}; the global profile and other servers stay unchanged.`
                  : "Avatar, banner, and bio editing is locked until this server has Premium. Factory Reset remains available for an existing custom appearance."}
              </p>
            </div>
          </div>
        </div>

        <MediaEditor
          kind="avatar"
          title="Bot Avatar"
          description="Choose the avatar CURSED uses only inside this server."
          currentUrl={data.profile.avatarUrl}
          previewUrl={avatarPreview}
          customActive={data.profile.hasCustomAvatar}
          premium={data.premium}
          saving={saving}
          uploadLabel={avatarUploadLabel}
          urlValue={avatarUrl}
          fileInputRef={avatarInputRef}
          onUrlChange={(value) => {
            setAvatarUrl(value);
            setAvatarUploadLabel(null);
            setAvatarDraft(value.trim() ? value.trim() : undefined);
          }}
          onUpload={(file) => void handleLocalUpload("avatar", file)}
          onReset={() => {
            setAvatarDraft(null);
            setAvatarUrl("");
            setAvatarUploadLabel("Reset to global avatar pending");
          }}
        />

        <MediaEditor
          kind="banner"
          title="Bot Banner"
          description="Give CURSED a server-specific profile banner without changing other servers."
          currentUrl={data.profile.bannerUrl}
          previewUrl={bannerPreview}
          customActive={data.profile.hasCustomBanner}
          premium={data.premium}
          saving={saving}
          uploadLabel={bannerUploadLabel}
          urlValue={bannerUrl}
          fileInputRef={bannerInputRef}
          onUrlChange={(value) => {
            setBannerUrl(value);
            setBannerUploadLabel(null);
            setBannerDraft(value.trim() ? value.trim() : undefined);
          }}
          onUpload={(file) => void handleLocalUpload("banner", file)}
          onReset={() => {
            setBannerDraft(null);
            setBannerUrl("");
            setBannerUploadLabel("Reset to global banner pending");
          }}
        />

        <DashboardCard
          title="Bot Bio"
          description="Set the short bio CURSED shows specifically in this server."
          icon={TextQuote}
          action={<PremiumBadge />}
        >
          <div className="rounded-xl border border-white/[0.06] bg-black/15 p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ash">
              Currently active
            </p>
            <div className="mt-3 min-h-14 rounded-lg border-l-2 border-amber-400/60 bg-black/20 px-4 py-3 text-sm text-fog">
              {data.profile.bio || "No server-specific bio is active."}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <Label htmlFor="server-bio">Update biography</Label>
              <span
                className={`text-[10px] ${
                  bioError ? "text-crimson-bright" : "text-ash"
                }`}
              >
                {bio.length}/{data.limits.bioMaxLength}
              </span>
            </div>
            <Textarea
              id="server-bio"
              rows={4}
              maxLength={data.limits.bioMaxLength + 20}
              placeholder="CURSED • AI, moderation and security for this server."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              disabled={!data.premium || saving}
            />
            {bioError ? (
              <p className="mt-2 text-xs text-crimson-bright">
                Bio must be {data.limits.bioMaxLength} characters or fewer.
              </p>
            ) : (
              <p className="mt-2 text-xs text-ash">
                Leave this empty and save to reset only the server bio.
              </p>
            )}
          </div>
        </DashboardCard>

        <div className="flex justify-end">
          <EditorActions
            dirty={dirty}
            saving={saving}
            hasErrors={hasErrors || !data.premium}
            onSave={saveAppearance}
            onReset={() => resetDrafts()}
          />
        </div>

        <div className="rounded-2xl border border-crimson/30 bg-crimson/[0.045] p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-crimson-bright">
                Factory Reset Appearance
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ash">
                Revert all per-server appearance customizations to the global CURSED defaults. This reset stays available even if Premium expires.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={factoryReset}
              disabled={!data.profile.hasCustomAppearance || resetting || saving}
              className="border-crimson/35 text-crimson-bright hover:border-crimson/60 hover:bg-crimson/[0.08]"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Reset appearance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
