/**
 * Shape for the `autorole` sub-document inside `guildConfigs` (same
 * collection/contract as `welcome` — see `docs/ARCHITECTURE.md`).
 *
 * Pure configuration — this dashboard never assigns a role to anyone. The
 * bot reads this exact shape from MongoDB on its own schedule and performs
 * the actual `PUT /guilds/{id}/members/{id}/roles/{id}` calls itself.
 */

export interface AutoroleConfig {
  enabled: boolean;
  /** Discord role snowflakes. Order is preserved but not meaningful. */
  roleIds: string[];
  /**
   * true  → every role in `roleIds` is assigned to a new member.
   * false → the bot picks one role from `roleIds` (its own choice of
   *         strategy — e.g. random, or first-available) rather than all.
   */
  requireAll: boolean;
}

export const DEFAULT_AUTOROLE_CONFIG: AutoroleConfig = {
  enabled: false,
  roleIds: [],
  requireAll: true,
};
