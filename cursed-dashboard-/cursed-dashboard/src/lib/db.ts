import "server-only";
import { MongoClient, type Db, type Collection } from "mongodb";
import { requireServerEnv } from "@/lib/env";
import type { GuildConfigDocument } from "@/types/guild-config";
import type { PremiumEntitlementDocument } from "@/types/premium";

/**
 * MongoDB connection singleton.
 *
 * Per `docs/ARCHITECTURE.md`, this repo's API routes are the *only* code
 * allowed to open a MongoDB connection — pages and client components never
 * import this file directly, they go through `/api/*` routes. The bot
 * (separate repo/process) reads the same database independently; this file
 * has no knowledge of the bot and never imports anything from it.
 *
 * The client/connection is created lazily (inside a function, not at module
 * top-level) so that simply importing this file — e.g. during `next build`
 * static analysis — can't throw over a missing env var. It only throws when
 * a route handler actually tries to use the database at request time.
 *
 * In development, Next.js's fast-refresh re-evaluates modules on every
 * change, which would otherwise open a fresh MongoClient per edit. Caching
 * the promise on `globalThis` avoids exhausting connections locally; in
 * production each server instance keeps exactly one client for its
 * lifetime.
 */
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  const uri = requireServerEnv("MONGODB_URI");

  const isDev = process.env.NODE_ENV === "development";
  const cached = isDev ? global._mongoClientPromise : clientPromise;
  if (cached) {
    return cached;
  }

  // Don't cache a failed connection attempt — otherwise a transient outage
  // during startup would wedge every future call behind the same rejected
  // promise until the process restarts, even after the underlying issue
  // (network blip, Atlas maintenance, etc.) resolves.
  const promise = new MongoClient(uri).connect().catch((err) => {
    if (isDev) {
      global._mongoClientPromise = undefined;
    } else {
      clientPromise = undefined;
    }
    throw err;
  });

  if (isDev) {
    global._mongoClientPromise = promise;
  } else {
    clientPromise = promise;
  }
  return promise;
}

export async function getDb(): Promise<Db> {
  const dbName = requireServerEnv("MONGODB_DB_NAME");
  const client = await getClientPromise();
  return client.db(dbName);
}

/**
 * The `guildConfigs` collection — one document per guild, shared with the
 * bot (see `docs/ARCHITECTURE.md`). Every feature's settings (welcome,
 * goodbye, autorole, ...) live as sub-fields on the same document, keyed by
 * `guildId`, so the bot can load a guild's entire config in one read.
 */
export async function getGuildConfigsCollection(): Promise<
  Collection<GuildConfigDocument>
> {
  const db = await getDb();
  return db.collection<GuildConfigDocument>("guildConfigs");
}

/**
 * The `premiumEntitlements` collection (see `docs/ARCHITECTURE.md` —
 * "placeholder collection for the future Premium tier"). Server Settings
 * is currently the only reader of this collection, and it is READ-ONLY
 * here: nothing in this dashboard ever writes an entitlement. Granting
 * premium will eventually be owned by a billing webhook or admin tool
 * outside this repo, the same way the bot owns writing to its own
 * gateway-derived data.
 */
export async function getPremiumEntitlementsCollection(): Promise<
  Collection<PremiumEntitlementDocument>
> {
  const db = await getDb();
  return db.collection<PremiumEntitlementDocument>("premiumEntitlements");
}
