"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ManageableGuild } from "@/types/discord";

const GuildContext = createContext<ManageableGuild | null>(null);

/**
 * Makes the active guild available to any Client Component in the guild
 * dashboard tree (Sidebar, GuildSwitcher, page headers, future feature
 * pages) without every one of them re-fetching or re-verifying it.
 *
 * This context is display-only by design. The `guild` prop it's given is
 * always the object `requireSelectedGuild()` already verified server-side
 * in `(guild)/layout.tsx` — nothing here re-derives a guild ID from the
 * client, and no Client Component should treat data read from this
 * context as authorization for anything. Any action that changes state for
 * a guild (writes, once those exist) must re-verify server-side the same
 * way `selectServer` and `requireSelectedGuild` already do, exactly like
 * the client's claimed guildId is never trusted in the OAuth/permission
 * flow from Step 4.
 */
export function GuildProvider({
  guild,
  children,
}: {
  guild: ManageableGuild;
  children: ReactNode;
}) {
  return (
    <GuildContext.Provider value={guild}>{children}</GuildContext.Provider>
  );
}

/** Reads the active guild. Throws if used outside `(guild)/layout.tsx`'s tree. */
export function useGuild(): ManageableGuild {
  const guild = useContext(GuildContext);
  if (!guild) {
    throw new Error(
      "useGuild() was called outside a GuildProvider — this component must render under (dashboard)/dashboard/(guild)/layout.tsx."
    );
  }
  return guild;
}
