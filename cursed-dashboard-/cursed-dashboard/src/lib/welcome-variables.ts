/**
 * Client-safe helper that mimics how the bot will substitute template
 * variables when it actually sends the welcome message. This is used only
 * to render the live preview in the dashboard — the dashboard never sends a
 * real message, and the raw `{variable}` placeholders are what actually get
 * stored in MongoDB (the bot does its own substitution at send-time).
 */

export interface WelcomePreviewSample {
  user: string;
  mention: string;
  server: string;
  membercount: string;
}

export const WELCOME_VARIABLES: {
  token: string;
  label: string;
}[] = [
  { token: "{user}", label: "Member's name" },
  { token: "{mention}", label: "@Mentions the member" },
  { token: "{server}", label: "Server name" },
  { token: "{membercount}", label: "Member count" },
];

export function substituteWelcomeVariables(
  template: string,
  sample: WelcomePreviewSample
): string {
  return template
    .replaceAll("{user}", sample.user)
    .replaceAll("{mention}", sample.mention)
    .replaceAll("{server}", sample.server)
    .replaceAll("{membercount}", sample.membercount);
}
