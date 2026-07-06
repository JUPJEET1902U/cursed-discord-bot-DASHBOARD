/**
 * Curated subset of IANA timezone identifiers for the Server Settings
 * selector. This list is intentionally short (common zones only) so the
 * dropdown stays usable — the server accepts *any* valid IANA zone name
 * (validated against `Intl.supportedValuesOf("timeZone")`), so a guild
 * whose timezone was set some other way (future bulk-import, API, etc.)
 * won't get rejected just for not appearing in this shortlist.
 */
export interface TimezoneOption {
  value: string;
  label: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Sao_Paulo", label: "Brasília Time (São Paulo)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris / Berlin / Madrid" },
  { value: "Europe/Athens", label: "Athens / Helsinki" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Karachi", label: "Karachi" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Dhaka", label: "Dhaka" },
  { value: "Asia/Bangkok", label: "Bangkok / Jakarta" },
  { value: "Asia/Singapore", label: "Singapore / Kuala Lumpur" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Seoul", label: "Korea (Seoul)" },
  { value: "Australia/Sydney", label: "Sydney / Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
];
