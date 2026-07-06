"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { DiscordChannel } from "@/types/discord";

interface LogChannelSelectProps {
  id: string;
  channels: DiscordChannel[] | null;
  value: string | null;
  onChange: (channelId: string | null) => void;
  disabled?: boolean;
}

/**
 * Single-channel picker shared by every log category row. Mirrors the
 * welcome-channel selector's behavior exactly: a real `<Select>` when the
 * guild's channel list is available, falling back to manual snowflake entry
 * otherwise. The server re-validates the chosen channel against the guild's
 * real list on save regardless of which path was used.
 */
export function LogChannelSelect({
  id,
  channels,
  value,
  onChange,
  disabled,
}: LogChannelSelectProps) {
  if (channels) {
    return (
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger id={id} disabled={disabled}>
          <SelectValue placeholder="Select a channel..." />
        </SelectTrigger>
        <SelectContent>
          {channels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ash">
              No text channels found.
            </div>
          ) : (
            channels.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                #{c.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={id}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="Channel ID (e.g. 123456789012345678)"
    />
  );
}
