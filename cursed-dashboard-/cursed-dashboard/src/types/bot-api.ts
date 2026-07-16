import type { WelcomeConfig } from "@/types/welcome";

export interface BotApiChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
}

export interface BotApiRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface BotWelcomeData {
  config: WelcomeConfig;
  channels: BotApiChannel[];
}

export interface BotAutoroleConfig {
  autoroleId: string | null;
  autoroleRoleName: string | null;
}

export interface BotAutoroleData {
  config: BotAutoroleConfig;
  enabled: boolean;
  roles: BotApiRole[];
  canManageRoles: boolean;
  currentRole: (BotApiRole & {
    assignable: boolean;
    unavailableReason: string | null;
  }) | null;
  unavailableReason: string | null;
}

export interface BotOverviewData {
  bot: {
    ready: boolean;
    pingMs: number | null;
    uptimeMs: number | null;
    presence: string | null;
  };
  mongo: { connected: boolean; state: string };
  guild: {
    id: string;
    name: string;
    iconUrl: string | null;
    memberCount: number;
    boostCount: number | null;
    botIsMember: true;
  };
  aiProviders: {
    gemini: boolean;
    groq: boolean;
    openRouter: boolean;
  };
  activity:
    | {
        available: true;
        totalMessages: number;
        totalCommands: number;
        totalVoiceSeconds: number;
        trackedUsers: number;
        activeUsers: number;
        lastActivityAt: string | null;
      }
    | { available: false };
  recentActivity: { available: false; items: [] };
}
