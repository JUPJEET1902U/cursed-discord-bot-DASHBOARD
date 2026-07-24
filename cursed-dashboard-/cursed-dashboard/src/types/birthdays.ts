export interface BirthdayConfig {
  guildId: string;
  enabled: boolean;
  announcementChannelId: string | null;
  timezone: string;
  dmEnabled: boolean;
  announcementEnabled: boolean;
  announcementTemplate: string;
  dmTemplate: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface BirthdayEntry {
  guildId: string;
  userId: string;
  day: number;
  month: number;
  year: number | null;
  addedBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  inGuild: boolean;
  publicDate: string;
}

export interface BirthdayChannel {
  id: string;
  name: string;
  type: number;
}

export interface BirthdaysData {
  config: BirthdayConfig;
  birthdays: BirthdayEntry[];
  channels: BirthdayChannel[];
  guild: { id: string; name: string };
}

export interface BirthdaySettingsInput {
  enabled: boolean;
  announcementChannelId: string | null;
  timezone: string;
  dmEnabled: boolean;
  announcementEnabled: boolean;
  announcementTemplate: string;
  dmTemplate: string;
}
