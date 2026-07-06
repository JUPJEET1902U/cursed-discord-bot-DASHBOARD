import { handlers } from "@/lib/auth";

/**
 * Auth.js owns everything under /api/auth/*: /api/auth/signin/discord kicks
 * off the OAuth2 redirect, Discord calls back to
 * /api/auth/callback/discord (registered as the app's redirect URI), and
 * Auth.js exchanges the code for tokens, runs the callbacks in
 * `src/lib/auth/config.ts`, and sets the session cookie — all before this
 * file's code ever runs. There is no manual token exchange to write.
 *
 * This supersedes the empty `api/auth/discord/callback/` stub sketched in
 * docs/ARCHITECTURE.md, which predates the decision (made in this step's
 * requirements) to use Auth.js instead of a hand-rolled OAuth2 flow.
 */
export const { GET, POST } = handlers;
