"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AutoroleRole, CurrentAutoroleRole } from "@/types/autorole";

interface RolePickerProps {
  roles: AutoroleRole[];
  currentRole: CurrentAutoroleRole | null;
  value: string | null;
  onChange: (roleId: string) => void;
  disabled?: boolean;
}

function roleColor(color: number): string {
  return color === 0 ? "#8B8B96" : `#${color.toString(16).padStart(6, "0")}`;
}

export function RolePicker({
  roles,
  currentRole,
  value,
  onChange,
  disabled,
}: RolePickerProps) {
  const includeCurrent =
    currentRole && !roles.some((role) => role.id === currentRole.id);

  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id="autorole-role">
        <SelectValue placeholder="Select an assignable role..." />
      </SelectTrigger>
      <SelectContent>
        {includeCurrent ? (
          <SelectItem value={currentRole.id} disabled>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: roleColor(currentRole.color) }}
              />
              {currentRole.name} (unavailable)
            </span>
          </SelectItem>
        ) : null}
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: roleColor(role.color) }}
              />
              {role.name}
            </span>
          </SelectItem>
        ))}
        {roles.length === 0 && !includeCurrent ? (
          <div className="px-3 py-2 text-sm text-ash">No assignable roles found.</div>
        ) : null}
      </SelectContent>
    </Select>
  );
}
