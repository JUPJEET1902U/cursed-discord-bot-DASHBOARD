"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiscordRole } from "@/types/discord";

interface RolePickerProps {
  roles: DiscordRole[] | null;
  botHighestRolePosition: number | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const SNOWFLAKE = /^\d{17,20}$/;

/** Discord role colors default to 0 ("no color") — render those as ash, not black. */
function roleColorHex(color: number): string {
  if (color === 0) return "#8B8B96";
  return `#${color.toString(16).padStart(6, "0")}`;
}

function isAboveBot(role: DiscordRole, botHighestRolePosition: number | null) {
  return botHighestRolePosition !== null && role.position >= botHighestRolePosition;
}

function RoleChip({
  role,
  warning,
  onRemove,
  disabled,
}: {
  role: { id: string; name: string; color: number };
  warning: boolean;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1 pl-2 pr-1.5 text-sm text-fog">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: roleColorHex(role.color) }}
      />
      <span className="max-w-[10rem] truncate">{role.name}</span>
      {warning ? (
        <AlertTriangle
          className="h-3.5 w-3.5 shrink-0 text-crimson-bright"
          aria-label="Above the bot's highest role — it can't assign this."
        />
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${role.name}`}
        className="ml-0.5 rounded p-0.5 text-ash transition-colors hover:bg-white/[0.06] hover:text-fog disabled:pointer-events-none"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/**
 * Searchable multi-select for guild roles. Renders as a filterable list
 * (rather than a native <select>, which can't multi-select comfortably or
 * show color swatches) plus removable chips for the current selection.
 *
 * When `roles` is null (bot not in this guild yet / role list unavailable),
 * falls back to manual snowflake entry so the feature still works — the
 * server re-validates against the real role list on save regardless.
 */
export function RolePicker({
  roles,
  botHighestRolePosition,
  selectedIds,
  onChange,
  disabled,
}: RolePickerProps) {
  const [query, setQuery] = useState("");
  const [manualId, setManualId] = useState("");

  const selectedRoles = useMemo(() => {
    if (!roles) return [];
    const byId = new Map(roles.map((r) => [r.id, r]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((r): r is DiscordRole => Boolean(r));
  }, [roles, selectedIds]);

  const filtered = useMemo(() => {
    if (!roles) return [];
    const q = query.trim().toLowerCase();
    return roles.filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [roles, query]);

  function toggle(id: string) {
    if (disabled) return;
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  function addManual() {
    const id = manualId.trim();
    if (!SNOWFLAKE.test(id) || selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setManualId("");
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {roles
            ? selectedRoles.map((role) => (
                <RoleChip
                  key={role.id}
                  role={role}
                  warning={isAboveBot(role, botHighestRolePosition)}
                  onRemove={() => remove(role.id)}
                  disabled={disabled}
                />
              ))
            : selectedIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1 pl-2 pr-1.5 font-mono text-xs text-fog"
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    disabled={disabled}
                    aria-label={`Remove role ${id}`}
                    className="rounded p-0.5 text-ash hover:bg-white/[0.06] hover:text-fog"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
        </div>
      ) : (
        <p className="text-xs text-ash">No roles selected yet.</p>
      )}

      {roles ? (
        <div className="rounded-lg border border-white/10 bg-steel/40">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-ash" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles..."
              aria-label="Search roles"
              disabled={disabled}
              className="w-full bg-transparent text-sm text-fog placeholder:text-ash/70 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2.5 py-3 text-center text-xs text-ash">
                No roles match &quot;{query}&quot;.
              </p>
            ) : (
              filtered.map((role) => {
                const isSelected = selectedIds.includes(role.id);
                const warning = isAboveBot(role, botHighestRolePosition);
                return (
                  <button
                    key={role.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(role.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected
                        ? "bg-violet/[0.14] text-fog"
                        : "text-fog/90 hover:bg-white/[0.04]"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: roleColorHex(role.color) }}
                    />
                    <span className="min-w-0 flex-1 truncate">{role.name}</span>
                    {warning ? (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-crimson-bright">
                        <AlertTriangle className="h-3 w-3" />
                        Above bot
                      </span>
                    ) : null}
                    {isSelected ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-bright" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ash">
            Couldn&apos;t load this server&apos;s role list — add role IDs
            manually. (Enable Developer Mode in Discord, then right-click a
            role → Copy Role ID.)
          </p>
          <div className="flex gap-2">
            <Input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Role ID (e.g. 123456789012345678)"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManual();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={addManual}
              disabled={disabled || !SNOWFLAKE.test(manualId.trim())}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
