import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Protects every /dashboard/* route. Runs on the edge before any Server
 * Component renders, so an unauthenticated request never even reaches
 * dashboard page code.
 *
 * The `authorized` callback in `src/lib/auth/config.ts` decides whether a
 * given request is allowed through; here we just decide what happens when
 * it isn't — redirect to /login and remember where the user was headed via
 * `callbackUrl`, so `src/app/(auth)/login/page.tsx` can send them straight
 * back after signing in.
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname, origin } = req.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Only run the (comparatively expensive) session check where it matters.
  matcher: ["/dashboard/:path*"],
};
