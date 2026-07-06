/**
 * Shape for the `logs` sub-document inside `guildConfigs` (same
 * collection/contract as `welcome`/`autorole` — see `docs/ARCHITECTURE.md`).
 *
 * Pure configuration — this dashboard never reads audit logs, never listens
 * for Discord gateway events, and never posts a log message anywhere. The
 * bot reads this exact shape from MongoDB on its own schedule and decides
 * for itself when/whether to post a log entry for a given event.
 */

/** Every loggable event category, keyed exactly as it's stored in Mongo. */
export const LOG_CATEGORY_KEYS = [
  "messageDelete",
  "messageEdit",
  "memberJoin",
  "memberLeave",
  "memberBan",
  "memberUnban",
  "memberTimeout",
  "memberNicknameChange",
  "roleCreate",
  "roleDelete",
  "roleUpdate",
  "channelCreate",
  "channelDelete",
  "channelUpdate",
  "voiceJoin",
  "voiceLeave",
  "emojiUpdate",
] as const;

export type LogCategoryKey = (typeof LOG_CATEGORY_KEYS)[number];

/** Per-category settings. `ignoreBots` is stored for every category (a
 * uniform document shape is simpler for the bot to read), even though the
 * UI only surfaces the toggle for categories where it's meaningful — see
 * `supportsIgnoreBots` on `LogCategoryMeta` below. */
export interface LogCategoryConfig {
  enabled: boolean;
  /** Discord channel snowflake to post this category's logs to. */
  channelId: string | null;
  /** true → post as a rich embed. false → plain text line. */
  embed: boolean;
  /** Hex color used for the embed side-bar, e.g. "#8B5CF6". */
  color: string;
  /** true → events performed by bot accounts are skipped. */
  ignoreBots: boolean;
}

export type LogsConfig = Record<LogCategoryKey, LogCategoryConfig>;

export const DEFAULT_LOG_CATEGORY_CONFIG: LogCategoryConfig = {
  enabled: false,
  channelId: null,
  embed: true,
  color: "#8B5CF6",
  ignoreBots: true,
};

export const DEFAULT_LOGS_CONFIG: LogsConfig = LOG_CATEGORY_KEYS.reduce(
  (acc, key) => {
    acc[key] = { ...DEFAULT_LOG_CATEGORY_CONFIG };
    return acc;
  },
  {} as LogsConfig
);

export interface LogCategoryMeta {
  key: LogCategoryKey;
  label: string;
  description: string;
  /**
   * Whether "Ignore Bots" is meaningful for this category. Message, member,
   * and voice events are commonly triggered by bot accounts (welcome bots,
   * music bots, other moderation bots), so filtering them out is a real
   * use case. Role/channel/emoji changes are server-configuration events
   * admins usually want logged regardless of which account made them, so
   * the toggle is hidden there to avoid clutter.
   */
  supportsIgnoreBots: boolean;
}

export interface LogCategoryGroup {
  title: string;
  categories: LogCategoryMeta[];
}

/** Drives both the UI grouping/order and the copy shown for each category. */
export const LOG_CATEGORY_GROUPS: LogCategoryGroup[] = [
  {
    title: "Messages",
    categories: [
      {
        key: "messageDelete",
        label: "Message Delete",
        description: "A message was deleted in this server.",
        supportsIgnoreBots: true,
      },
      {
        key: "messageEdit",
        label: "Message Edit",
        description: "A message was edited in this server.",
        supportsIgnoreBots: true,
      },
    ],
  },
  {
    title: "Members",
    categories: [
      {
        key: "memberJoin",
        label: "Member Join",
        description: "Someone joined the server.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberLeave",
        label: "Member Leave",
        description: "Someone left or was removed from the server.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberBan",
        label: "Member Ban",
        description: "A member was banned.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberUnban",
        label: "Member Unban",
        description: "A member was unbanned.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberTimeout",
        label: "Member Timeout",
        description: "A member was timed out (or a timeout was lifted).",
        supportsIgnoreBots: true,
      },
      {
        key: "memberNicknameChange",
        label: "Member Nickname Change",
        description: "A member's server nickname changed.",
        supportsIgnoreBots: true,
      },
    ],
  },
  {
    title: "Roles",
    categories: [
      {
        key: "roleCreate",
        label: "Role Create",
        description: "A role was created.",
        supportsIgnoreBots: false,
      },
      {
        key: "roleDelete",
        label: "Role Delete",
        description: "A role was deleted.",
        supportsIgnoreBots: false,
      },
      {
        key: "roleUpdate",
        label: "Role Update",
        description: "A role's name, color, or permissions changed.",
        supportsIgnoreBots: false,
      },
    ],
  },
  {
    title: "Channels",
    categories: [
      {
        key: "channelCreate",
        label: "Channel Create",
        description: "A channel was created.",
        supportsIgnoreBots: false,
      },
      {
        key: "channelDelete",
        label: "Channel Delete",
        description: "A channel was deleted.",
        supportsIgnoreBots: false,
      },
      {
        key: "channelUpdate",
        label: "Channel Update",
        description: "A channel's settings changed.",
        supportsIgnoreBots: false,
      },
    ],
  },
  {
    title: "Voice",
    categories: [
      {
        key: "voiceJoin",
        label: "Voice Join",
        description: "A member joined a voice channel.",
        supportsIgnoreBots: true,
      },
      {
        key: "voiceLeave",
        label: "Voice Leave",
        description: "A member left a voice channel.",
        supportsIgnoreBots: true,
      },
    ],
  },
  {
    title: "Emoji",
    categories: [
      {
        key: "emojiUpdate",
        label: "Emoji Updates",
        description: "An emoji was added, removed, or renamed.",
        supportsIgnoreBots: false,
      },
    ],
  },
];

export const LOG_CATEGORY_META: Record<LogCategoryKey, LogCategoryMeta> =
  LOG_CATEGORY_GROUPS.flatMap((g) => g.categories).reduce(
    (acc, meta) => {
      acc[meta.key] = meta;
      return acc;
    },
    {} as Record<LogCategoryKey, LogCategoryMeta>
  );
