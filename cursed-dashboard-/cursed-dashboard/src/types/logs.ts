import type { DiscordChannel } from "@/types/discord";

/** Every loggable CURSED event category, keyed exactly as it is stored. */
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
  "voiceSwitch",
  "voiceState",
  "guildUpdate",
  "inviteCreate",
  "inviteDelete",
  "emojiUpdate",
  "moderationAction",
  "securityAlert",
  "ticketEvent",
] as const;

export type LogCategoryKey = (typeof LOG_CATEGORY_KEYS)[number];

export interface LogCategoryConfig {
  enabled: boolean;
  channelId: string | null;
  embed: boolean;
  color: string;
  ignoreBots: boolean;
  /** Only used by Message Delete. Kept in the uniform shape for safe API validation. */
  includeContent: boolean;
}

export type LogsConfig = Record<LogCategoryKey, LogCategoryConfig>;

export const DEFAULT_LOG_CATEGORY_CONFIG: LogCategoryConfig = {
  enabled: false,
  channelId: null,
  embed: true,
  color: "#8B5CF6",
  ignoreBots: true,
  includeContent: false,
};

export const DEFAULT_LOGS_CONFIG: LogsConfig = LOG_CATEGORY_KEYS.reduce(
  (acc, key) => {
    acc[key] = { ...DEFAULT_LOG_CATEGORY_CONFIG };
    return acc;
  },
  {} as LogsConfig
);

export interface LogsDashboardData {
  config: LogsConfig;
  channels: DiscordChannel[];
}

export interface LogCategoryMeta {
  key: LogCategoryKey;
  label: string;
  description: string;
  supportsIgnoreBots: boolean;
  /** Existing branded subsystem logs keep their fixed CURSED card format. */
  supportsFormatting?: boolean;
  /** Message Delete can optionally include the deleted text. */
  supportsDeletedContent?: boolean;
}

export interface LogCategoryGroup {
  title: string;
  categories: LogCategoryMeta[];
}

export const LOG_CATEGORY_GROUPS: LogCategoryGroup[] = [
  {
    title: "Messages",
    categories: [
      {
        key: "messageDelete",
        label: "Message Delete",
        description: "Log deleted messages, attachments, author, and channel metadata.",
        supportsIgnoreBots: true,
        supportsDeletedContent: true,
      },
      {
        key: "messageEdit",
        label: "Message Edit",
        description: "Log before/after message content with a jump link.",
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
        description: "Log account age and member count when someone joins.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberLeave",
        label: "Member Leave / Remove",
        description: "Log members leaving or being removed from the server.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberBan",
        label: "Member Ban",
        description: "Log bans with the audit-log executor when available.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberUnban",
        label: "Member Unban",
        description: "Log unbans with the audit-log executor when available.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberTimeout",
        label: "Member Timeout",
        description: "Log timeouts and timeout removals.",
        supportsIgnoreBots: true,
      },
      {
        key: "memberNicknameChange",
        label: "Member Updates",
        description: "Log nickname changes and roles added or removed from a member.",
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
        description: "Log new roles and their permissions.",
        supportsIgnoreBots: false,
      },
      {
        key: "roleDelete",
        label: "Role Delete",
        description: "Log deleted roles and the responsible executor when available.",
        supportsIgnoreBots: false,
      },
      {
        key: "roleUpdate",
        label: "Role Update",
        description: "Log role name, color, and permission changes.",
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
        description: "Log newly created server channels.",
        supportsIgnoreBots: false,
      },
      {
        key: "channelDelete",
        label: "Channel Delete",
        description: "Log deleted channels and the responsible executor when available.",
        supportsIgnoreBots: false,
      },
      {
        key: "channelUpdate",
        label: "Channel Update",
        description: "Log channel name, category, topic, and slowmode changes.",
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
        description: "Log members joining voice channels.",
        supportsIgnoreBots: true,
      },
      {
        key: "voiceLeave",
        label: "Voice Leave",
        description: "Log members leaving voice channels.",
        supportsIgnoreBots: true,
      },
      {
        key: "voiceSwitch",
        label: "Voice Switch",
        description: "Log members moving between voice channels.",
        supportsIgnoreBots: true,
      },
      {
        key: "voiceState",
        label: "Mute / Deafen",
        description: "Log self/server mute, unmute, deafen, and undeafen changes.",
        supportsIgnoreBots: true,
      },
    ],
  },
  {
    title: "Server",
    categories: [
      {
        key: "guildUpdate",
        label: "Server Updates",
        description: "Log server name, verification, and AFK-setting changes.",
        supportsIgnoreBots: false,
      },
      {
        key: "inviteCreate",
        label: "Invite Create",
        description: "Log newly created invite codes and their destination channel.",
        supportsIgnoreBots: false,
      },
      {
        key: "inviteDelete",
        label: "Invite Delete",
        description: "Log deleted or revoked server invites.",
        supportsIgnoreBots: false,
      },
      {
        key: "emojiUpdate",
        label: "Emoji Updates",
        description: "Log emojis being added, removed, or renamed.",
        supportsIgnoreBots: false,
      },
    ],
  },
  {
    title: "Moderation",
    categories: [
      {
        key: "moderationAction",
        label: "Moderation Actions",
        description: "Route CURSED warnings, timeouts, kicks, bans, locks, AutoMod actions, and cases.",
        supportsIgnoreBots: false,
        supportsFormatting: false,
      },
    ],
  },
  {
    title: "Security",
    categories: [
      {
        key: "securityAlert",
        label: "Security Alerts",
        description: "Route anti-nuke, anti-raid, tamper, and incident alerts without changing protection behavior.",
        supportsIgnoreBots: false,
        supportsFormatting: false,
      },
    ],
  },
  {
    title: "Tickets",
    categories: [
      {
        key: "ticketEvent",
        label: "Ticket Events",
        description: "Route ticket open, close, claim, status, priority, and related ticket events.",
        supportsIgnoreBots: false,
        supportsFormatting: false,
      },
    ],
  },
];

export const LOG_CATEGORY_META: Record<LogCategoryKey, LogCategoryMeta> =
  LOG_CATEGORY_GROUPS.flatMap((group) => group.categories).reduce(
    (acc, meta) => {
      acc[meta.key] = meta;
      return acc;
    },
    {} as Record<LogCategoryKey, LogCategoryMeta>
  );
