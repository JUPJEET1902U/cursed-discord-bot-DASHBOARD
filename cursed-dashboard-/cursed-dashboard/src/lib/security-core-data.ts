import type { SecurityData } from "@/types/security";

export function coreSecurityData(data: SecurityData): SecurityData {
  const config = data.config;
  return {
    ...data,
    config: {
      enabled: config.enabled,
      securityLogChannelId: config.securityLogChannelId,
      antiRaid: {
        enabled: config.antiRaid.enabled,
        joinThreshold: config.antiRaid.joinThreshold,
        windowSeconds: config.antiRaid.windowSeconds,
        minAccountAgeHours: config.antiRaid.minAccountAgeHours,
        action: config.antiRaid.action,
        activeRaidSeconds: config.antiRaid.activeRaidSeconds,
      },
      antiNuke: {
        ...config.antiNuke,
        thresholds: { ...config.antiNuke.thresholds },
      },
      messageShield: { ...config.messageShield },
      quarantine: { ...config.quarantine },
      lockdown: {
        ...config.lockdown,
        channelIds: [...config.lockdown.channelIds],
      },
      trusted: {
        enabled: config.trusted.enabled,
        entries: config.trusted.entries.map((entry) => ({
          subjectType: entry.subjectType,
          subjectId: entry.subjectId,
          scopes: [...entry.scopes],
        })),
      },
    },
  };
}