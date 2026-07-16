import "server-only";

type ServerEnvKey =
  | "DASHBOARD_URL"
  | "NEXTAUTH_SECRET"
  | "DISCORD_CLIENT_ID"
  | "DISCORD_CLIENT_SECRET"
  | "DISCORD_BOT_TOKEN"
  | "MONGODB_URI"
  | "MONGODB_DB_NAME"
  | "BOT_STATUS_API_URL"
  | "BOT_STATUS_API_KEY"
  | "BOT_API_URL"
  | "DASHBOARD_API_SECRET";

export const REQUIRED_AUTH_ENV = [
  "DASHBOARD_URL",
  "NEXTAUTH_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
] as const satisfies readonly ServerEnvKey[];

export const OPTIONAL_SERVER_ENV = [
  "DISCORD_BOT_TOKEN",
  "MONGODB_URI",
  "MONGODB_DB_NAME",
  "BOT_STATUS_API_URL",
  "BOT_STATUS_API_KEY",
  "BOT_API_URL",
  "DASHBOARD_API_SECRET",
] as const satisfies readonly ServerEnvKey[];

export function getOptionalServerEnv(key: ServerEnvKey): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export function requireServerEnv(key: ServerEnvKey): string {
  const value = getOptionalServerEnv(key);
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

export function getMissingRequiredEnv(
  keys: readonly ServerEnvKey[] = REQUIRED_AUTH_ENV
): ServerEnvKey[] {
  return keys.filter((key) => !getOptionalServerEnv(key));
}

export function assertRequiredEnv(
  keys: readonly ServerEnvKey[] = REQUIRED_AUTH_ENV
): void {
  const missing = getMissingRequiredEnv(keys);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
